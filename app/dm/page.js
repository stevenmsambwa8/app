'use client'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import styles from './page.module.css'

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'sasa hivi';
  if (mins < 60) return `dakika ${mins}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs}`;
  const days = Math.floor(hrs / 24);
  return `siku ${days}`;
}

function mapProfile(id, p) {
  return {
    id,
    name: p?.username || 'Mtumiaji',
    avatar: p?.avatar || '🐧',
    avatarUrl: p?.avatar_url || null,
  };
}

function DMPageInner() {
  const { user, loading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
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
  const bottomRef = useRef(null);

  const fetchProfiles = useCallback(async (ids) => {
    const missing = ids.filter((id) => id && !profiles[id]);
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
  }, [profiles]);

  // Load conversation list: every message involving me, collapsed to the
  // latest message per other participant.
  const loadConvos = useCallback(async () => {
    if (!user) return;
    setConvosLoading(true);
    const { data, error } = await supabase
      .from('dm_messages')
      .select('id, sender_id, recipient_id, text, read, created_at')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setConvosLoading(false);
      return;
    }

    const byOther = new Map();
    for (const m of data) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!byOther.has(otherId)) {
        byOther.set(otherId, { uid: otherId, lastText: m.text, lastTime: m.created_at, unread: 0 });
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
      .select('id, sender_id, recipient_id, text, read, created_at')
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
  }, [messages.length, activeId]);

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
              setConvos((cs) => {
                const exists = cs.find((c) => c.uid === m.sender_id);
                if (exists) {
                  return cs.map((c) =>
                    c.uid === m.sender_id
                      ? { ...c, lastText: m.text, lastTime: m.created_at, unread: c.unread + 1 }
                      : c
                  );
                }
                return [{ uid: m.sender_id, lastText: m.text, lastTime: m.created_at, unread: 1 }, ...cs];
              });
            }
            return current;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfiles]);

  async function send() {
    const text = draft.trim();
    if (!text || !activeId || !user || sending) return;
    setSending(true);
    setDraft('');

    const optimistic = {
      id: `local-${Date.now()}`,
      sender_id: user.id,
      recipient_id: activeId,
      text,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('dm_messages')
      .insert({ sender_id: user.id, recipient_id: activeId, text })
      .select()
      .single();

    setSending(false);
    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    setConvos((cs) => {
      const exists = cs.find((c) => c.uid === activeId);
      if (exists) {
        return cs.map((c) =>
          c.uid === activeId ? { ...c, lastText: data.text, lastTime: data.created_at } : c
        );
      }
      return [{ uid: activeId, lastText: data.text, lastTime: data.created_at, unread: 0 }, ...cs];
    });
  }

  function openThread(uid) {
    setActiveId(uid);
    router.replace(`/dm?with=${uid}`);
  }

  function backToList() {
    setActiveId(null);
    router.replace('/dm');
  }

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
      <div className={styles.list}>
        {convosLoading ? (
          <p className={styles.last}>Inapakia ujumbe…</p>
        ) : convos.length === 0 ? (
          <p className={styles.last}>Bado huna mazungumzo. Fungua profaili ya mtu na umtumie ujumbe.</p>
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
    );
  }

  const activeProfile = profiles[activeId] || mapProfile(activeId, null);

  return (
    <div className={styles.thread}>
      <div className={styles.threadHeader}>
        <button className={styles.back} onClick={backToList}>
          <i className="ri-arrow-left-line" />
        </button>
        <Avatar emoji={activeProfile.avatar} src={activeProfile.avatarUrl} size={32} />
        <span className={styles.threadName}>{activeProfile.name}</span>
      </div>

      <div className={styles.messages}>
        {threadLoading ? (
          <p className={styles.last}>Inapakia…</p>
        ) : messages.length === 0 ? (
          <p className={styles.last}>Andika ujumbe wa kwanza.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.bubble} ${m.sender_id === user.id ? styles.me : styles.them}`}
            >
              {m.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.composer}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Andika ujumbe..."
        />
        <button className={styles.send} onClick={send} disabled={sending}>
          <i className="ri-send-plane-fill" />
        </button>
      </div>
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
