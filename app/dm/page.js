'use client'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import Avatar from '../../components/Avatar'
import TwemojiText from '../../components/TwemojiText'
import VoiceNote from '../../components/VoiceNote'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { usePosts } from '../../components/PostsProvider'
import { getBlobDuration } from '../../lib/audioDuration'
import styles from './page.module.css'

const MAX_RECORD_SECONDS = 60;
const TYPING_BROADCAST_MS = 2000;
const TYPING_STALE_MS = 3000;

function mapProfile(id, p) {
  return {
    id,
    name: p?.username || 'Mtumiaji',
    avatar: p?.avatar || '🐧',
    avatarUrl: p?.avatar_url || null,
  };
}

function threadChannelName(a, b) {
  return `dm-typing-${[a, b].sort().join(':')}`;
}

function DMPageInner() {
  const { user, loading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const { uploadPostImage, uploadVoiceNote } = usePosts();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeId, setActiveId] = useState(null); // other user's uid
  const [profiles, setProfiles] = useState({}); // { [uid]: {id,name,avatar,avatarUrl} }
  const [convos, setConvos] = useState([]); // [{uid, lastText, lastTime, unread}]
  const [convosLoading, setConvosLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);

  // New-conversation search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Attachments
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingChannelRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingStaleTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const recordTimerRef = useRef(null);

  // fetchProfiles is intentionally stable (empty dep array) — it reads the
  // latest cache via profilesRef instead of closing over `profiles` state.
  // Previously it depended on [profiles], which meant its identity changed
  // on every new profile fetched; the realtime subscription effect below
  // depends on fetchProfiles, so that was tearing down and re-subscribing
  // the whole DM channel every time a message arrived from a new sender —
  // the resubscribe round-trip is what showed up as messages "delaying".
  const profilesRef = useRef(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const fetchProfiles = useCallback(async (ids) => {
    const missing = ids.filter((id) => id && !profilesRef.current[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar, avatar_url')
      .in('id', missing);
    if (!data) return;
    setProfiles((prev) => {
      const next = { ...prev };
      data.forEach((p) => {
        next[p.id] = mapProfile(p.id, p);
      });
      return next;
    });
  }, []);

  // Load conversation list: every message involving me, collapsed to the
  // latest message per other participant.
  const loadConvos = useCallback(async () => {
    if (!user) return;
    setConvosLoading(true);
    const { data, error } = await supabase
      .from('dm_messages')
      .select('id, sender_id, recipient_id, text, image_url, audio_url, read, created_at')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setConvosLoading(false);
      return;
    }

    const byOther = new Map();
    for (const m of data) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const preview = m.text || (m.image_url ? '📷 Picha' : m.audio_url ? '🎤 Ujumbe wa sauti' : '');
      if (!byOther.has(otherId)) {
        byOther.set(otherId, { uid: otherId, lastText: preview, lastTime: m.created_at, unread: 0 });
      }
      if (m.recipient_id === user.id && !m.read) {
        byOther.get(otherId).unread += 1;
      }
    }

    const list = Array.from(byOther.values());
    setConvos(list);
    fetchProfiles(list.map((c) => c.uid));
    setConvosLoading(false);
  }, [user, fetchProfiles]);

  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  // Deep-link support: /dm?with=<uid> opens (or starts) a thread directly,
  // e.g. from a profile page's Message button.
  useEffect(() => {
    const withId = searchParams.get('with');
    if (withId) {
      setActiveId(withId);
      fetchProfiles([withId]);
    }
  }, [searchParams, fetchProfiles]);

  // Load the active thread's messages and mark incoming ones as read.
  useEffect(() => {
    if (!user || !activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setThreadLoading(true);
    supabase
      .from('dm_messages')
      .select('id, sender_id, recipient_id, text, image_url, audio_url, audio_duration, read, created_at')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error) {
          setThreadLoading(false);
          return;
        }
        setMessages(data || []);
        setThreadLoading(false);

        const unreadIds = (data || [])
          .filter((m) => m.recipient_id === user.id && !m.read)
          .map((m) => m.id);
        if (unreadIds.length) {
          supabase.from('dm_messages').update({ read: true }).in('id', unreadIds).then(() => {
            setConvos((cs) => cs.map((c) => (c.uid === activeId ? { ...c, unread: 0 } : c)));
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, activeId, theirTyping]);

  // Realtime: any message where I'm the recipient lands here live, whether
  // the thread is open (append to it) or not (bump the conversation list).
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dm-inbox-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const m = payload.new;
          fetchProfiles([m.sender_id]);
          setActiveId((current) => {
            if (current === m.sender_id) {
              setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
              supabase.from('dm_messages').update({ read: true }).eq('id', m.id).then(() => {});
            } else {
              const preview = m.text || (m.image_url ? '📷 Picha' : m.audio_url ? '🎤 Ujumbe wa sauti' : '');
              setConvos((cs) => {
                const exists = cs.find((c) => c.uid === m.sender_id);
                if (exists) {
                  return cs.map((c) =>
                    c.uid === m.sender_id
                      ? { ...c, lastText: preview, lastTime: m.created_at, unread: c.unread + 1 }
                      : c
                  );
                }
                return [{ uid: m.sender_id, lastText: preview, lastTime: m.created_at, unread: 1 }, ...cs];
              });
            }
            return current;
          });
        }
      )
      // Catches my own sent messages flipping to read=true (seen state) and
      // any remote unsends of messages I received.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dm_messages', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          const m = payload.new;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'dm_messages' },
        (payload) => {
          const oldId = payload.old?.id;
          if (!oldId) return;
          setMessages((prev) => prev.filter((x) => x.id !== oldId));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfiles]);

  // Typing indicator: a lightweight broadcast channel per thread pair, not
  // backed by a table — nothing to persist, it just fades after a few
  // seconds of silence.
  useEffect(() => {
    if (!user || !activeId) return;
    const channel = supabase.channel(threadChannelName(user.id, activeId));
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.uid !== activeId) return;
        setTheirTyping(true);
        clearTimeout(typingStaleTimerRef.current);
        typingStaleTimerRef.current = setTimeout(() => setTheirTyping(false), TYPING_STALE_MS);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      clearTimeout(typingStaleTimerRef.current);
      setTheirTyping(false);
    };
  }, [user, activeId]);

  function handleDraftChange(e) {
    setDraft(e.target.value);
    const now = Date.now();
    if (typingChannelRef.current && now - lastTypingSentRef.current > TYPING_BROADCAST_MS) {
      lastTypingSentRef.current = now;
      typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { uid: user.id } });
    }
  }

  // Cleanup any in-flight recording if the component unmounts mid-record.
  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function sendMessage({ text, imageUrl, audioUrl, audioDuration }) {
    if (!activeId || !user) return;
    const optimistic = {
      id: `local-${Date.now()}`,
      sender_id: user.id,
      recipient_id: activeId,
      text: text || null,
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
      audio_duration: audioDuration || null,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('dm_messages')
      .insert({
        sender_id: user.id,
        recipient_id: activeId,
        text: text || null,
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        audio_duration: audioDuration || null,
      })
      .select()
      .single();

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      return { error };
    }
    setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    const preview = data.text || (data.image_url ? '📷 Picha' : data.audio_url ? '🎤 Ujumbe wa sauti' : '');
    setConvos((cs) => {
      const exists = cs.find((c) => c.uid === activeId);
      if (exists) {
        return cs.map((c) => (c.uid === activeId ? { ...c, lastText: preview, lastTime: data.created_at } : c));
      }
      return [{ uid: activeId, lastText: preview, lastTime: data.created_at, unread: 0 }, ...cs];
    });
    return { error: null };
  }

  async function send() {
    const text = draft.trim();
    if (sending) return;

    if (pendingImage) {
      setSending(true);
      setUploadingImage(true);
      const { error, url } = await uploadPostImage(pendingImage.file);
      setUploadingImage(false);
      if (!error && url) {
        await sendMessage({ text, imageUrl: url });
        setDraft('');
        clearPendingImage();
      }
      setSending(false);
      return;
    }

    if (!text) return;
    setSending(true);
    setDraft('');
    await sendMessage({ text });
    setSending(false);
  }

  function openThread(uid) {
    setActiveId(uid);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.replace(`/dm?with=${uid}`);
  }

  function backToList() {
    setActiveId(null);
    router.replace('/dm');
  }

  async function deleteMessage(id) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('dm_messages').delete().eq('id', id);
    loadConvos();
  }

  // Search people to start a brand-new conversation.
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id, username, avatar, avatar_url')
        .ilike('username', `%${q}%`)
        .neq('id', user?.id || '')
        .limit(15)
        .then(({ data }) => {
          if (cancelled) return;
          setSearchResults((data || []).map((p) => mapProfile(p.id, p)));
          setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, searchOpen, user]);

  function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function clearPendingImage() {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      recordedChunksRef.current = [];
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      setRecording(true);
    } catch {
      // mic permission denied or unavailable — silently no-op
    }
  }

  function stopRecordingTracks() {
    clearInterval(recordTimerRef.current);
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    setRecording(false);
  }

  function cancelRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    recordedChunksRef.current = [];
    stopRecordingTracks();
  }

  function finishRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      recordedChunksRef.current = [];
      if (blob.size > 0) {
        const duration = (await getBlobDuration(blob)) || recordSeconds;
        setSending(true);
        const { error, url } = await uploadVoiceNote(blob);
        if (!error && url) {
          await sendMessage({ audioUrl: url, audioDuration: Math.round(duration) });
        }
        setSending(false);
      }
    };
    recorder.stop();
    stopRecordingTracks();
  }

  useEffect(() => {
    if (recording && recordSeconds >= MAX_RECORD_SECONDS) finishRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, recordSeconds]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className={styles.list} style={{ alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
        <p>Ingia ili uone ujumbe wako.</p>
        <button type="button" className="btnAccent" style={{ marginTop: 12 }} onClick={() => openAuth('signin')}>
          Ingia
        </button>
      </div>
    );
  }

  if (!activeId) {
    return (
      <div className={styles.thread}>
        <div className={styles.threadHeader}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
            <i className="ri-arrow-left-line" />
          </button>
          <span className={styles.threadName}>{searchOpen ? 'Mtumiaji Mpya' : 'Ujumbe'}</span>
          <button
            className={styles.searchToggle}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Tafuta mtumiaji"
          >
            <i className={searchOpen ? 'ri-close-line' : 'ri-search-line'} />
          </button>
        </div>

        {searchOpen && (
          <div className={styles.searchBox}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tafuta jina la mtumiaji..."
              className={styles.searchInput}
            />
          </div>
        )}

        <div className={styles.list}>
          {searchOpen ? (
            searching ? (
              <p className={styles.last}>Inatafuta…</p>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <p className={styles.last}>Hakuna mtumiaji aliyepatikana.</p>
            ) : (
              searchResults.map((p) => (
                <button key={p.id} className={`card ${styles.row}`} onClick={() => openThread(p.id)}>
                  <Avatar emoji={p.avatar} src={p.avatarUrl} size={44} />
                  <div className={styles.who}>
                    <div className={styles.name}>{p.name}</div>
                  </div>
                </button>
              ))
            )
          ) : convosLoading ? (
            <p className={styles.last}>Inapakia ujumbe…</p>
          ) : convos.length === 0 ? (
            <p className={styles.last}>Bado huna mazungumzo. Bofya <i className="ri-search-line" /> kutafuta mtu.</p>
          ) : (
            convos
              .slice()
              .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
              .map((c) => {
                const p = profiles[c.uid] || mapProfile(c.uid, null);
                return (
                  <button key={c.uid} className={`card ${styles.row}`} onClick={() => openThread(c.uid)}>
                    <Avatar emoji={p.avatar} src={p.avatarUrl} size={44} ring={c.unread > 0} />
                    <div className={styles.who}>
                      <div className={styles.name}>{p.name}</div>
                      <span className={styles.last}>{c.lastText}</span>
                    </div>
                    {c.unread > 0 && <span className={styles.unread}>{c.unread}</span>}
                  </button>
                );
              })
          )}
        </div>
      </div>
    );
  }

  const activeProfile = profiles[activeId] || mapProfile(activeId, null);
  const myLastMessage = [...messages].reverse().find((m) => m.sender_id === user.id);

  return (
    <div className={styles.thread}>
      <div className={styles.threadHeader}>
        <button className={styles.back} onClick={backToList}>
          <i className="ri-arrow-left-line" />
        </button>
        <Avatar emoji={activeProfile.avatar} src={activeProfile.avatarUrl} size={32} />
        <div className={styles.who}>
          <span className={styles.threadName}>{activeProfile.name}</span>
          {theirTyping && <span className={styles.typingLabel}>anaandika…</span>}
        </div>
      </div>

      <div className={styles.messages}>
        {threadLoading ? (
          <p className={styles.last}>Inapakia…</p>
        ) : messages.length === 0 ? (
          <p className={styles.last}>Andika ujumbe wa kwanza.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.me : styles.them}`}>
                <div className={`${styles.bubble} ${mine ? styles.me : styles.them}`}>
                  {m.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image_url} alt="" className={styles.bubbleImage} />
                  )}
                  {m.audio_url && <VoiceNote src={m.audio_url} duration={m.audio_duration} />}
                  {m.text && <TwemojiText as="p" className={styles.bubbleText} text={m.text} />}
                </div>
                {mine && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => deleteMessage(m.id)}
                    aria-label="Futa ujumbe"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                )}
              </div>
            );
          })
        )}
        {theirTyping && (
          <div className={`${styles.bubble} ${styles.them} ${styles.typingBubble}`}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
          </div>
        )}
        {myLastMessage && (
          <span className={styles.seenLabel}>{myLastMessage.read ? 'Imeonekana' : 'Imetumwa'}</span>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingImage && (
        <div className={styles.attachPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingImage.previewUrl} alt="" />
          <button type="button" onClick={clearPendingImage} aria-label="Ondoa picha">
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {recording ? (
        <div className={styles.composer}>
          <button className={styles.cancelRecord} onClick={cancelRecording} aria-label="Ghairi">
            <i className="ri-close-line" />
          </button>
          <span className={styles.recordingIndicator}>
            <span className={styles.recDot} />
            Inarekodi… {recordSeconds}s
          </span>
          <button className={styles.send} onClick={finishRecording}>
            <i className="ri-send-plane-fill" />
          </button>
        </div>
      ) : (
        <div className={styles.composer}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={pickImage}
          />
          <button
            className={styles.attachBtn}
            onClick={() => imageInputRef.current?.click()}
            aria-label="Tuma picha"
            disabled={uploadingImage}
          >
            <i className="ri-image-add-line" />
          </button>
          <input
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Andika ujumbe..."
          />
          {draft.trim() || pendingImage ? (
            <button className={styles.send} onClick={send} disabled={sending}>
              <i className="ri-send-plane-fill" />
            </button>
          ) : (
            <button className={styles.send} onClick={startRecording} aria-label="Rekodi ujumbe wa sauti">
              <i className="ri-mic-line" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DMPage() {
  return (
    <Suspense fallback={null}>
      <DMPageInner />
    </Suspense>
  );
}
