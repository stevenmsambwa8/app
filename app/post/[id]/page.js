'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '../../../components/Avatar'
import Emoji from '../../../components/Emoji'
import TwemojiText from '../../../components/TwemojiText'
import UserBadge from '../../../components/UserBadge'
import FollowBtn from '../../../components/FollowBtn'
import EditPostModal from '../../../components/EditPostModal'
import AddToCartButton from '../../../components/AddToCartButton'
import { usePosts } from '../../../components/PostsProvider'
import { useAuth } from '../../../components/AuthProvider'
import { useAuthModal } from '../../../components/AuthModalProvider'
import { useFollow } from '../../../components/FollowProvider'
import { userById } from '../../../lib/mockData'
import { parsePostText } from '../../../lib/postText'
import { getBlobDuration } from '../../../lib/audioDuration'
import VoiceNote from '../../../components/VoiceNote'
import ShareCard from '../../../components/ShareCard'
import styles from './page.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

function isTemplateImage(src) {
  return typeof src === 'string' && src.startsWith('/post-templates/');
}

// Matches an in-progress "@word" right at the cursor, e.g. typing "...hi @za"
// while the caret sits right after the "za" — used to drive the mention
// suggestion dropdown.
function mentionQueryAt(value, caret) {
  const upToCaret = value.slice(0, caret);
  const match = upToCaret.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  return match ? match[1] : null;
}

function formatRecordTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Bolds every "@name" token in a comment/reply's text — mostly relevant for
// the "@Name " a reply starts with, but applies anywhere in the text.
function renderWithMentions(text) {
  if (!text) return text;
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => (part.startsWith('@') ? <strong key={i}>{part}</strong> : part));
}

// Voice notes auto-stop (and send) at this length, same idea as WhatsApp's cap.
const MAX_RECORD_SECONDS = 120;

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    posts,
    likes,
    toggleLike,
    deletePost,
    updatePost,
    fetchComments,
    getCachedComments,
    addComment,
    deleteComment,
    uploadVoiceNote,
  } = usePosts();
  const { user, profile } = useAuth();
  const { openAuth } = useAuthModal();
  const { isFollowing, toggleFollow, pending } = useFollow();

  function handleFollowClick(uid) {
    if (!user) {
      openAuth('signin');
      return;
    }
    toggleFollow(uid);
  }

  const post = posts.find((p) => String(p.id) === String(params.id) && p.kind !== 'ad');

  const [active, setActive] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openReplies, setOpenReplies] = useState({});
  // { rootId, label } — rootId is the top-level comment this reply attaches
  // to (replies are one level deep), label is who's shown in "Unajibu @Name".
  const [replyTarget, setReplyTarget] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const menuRef = useRef(null);
  const commentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!post || typeof post.id !== 'string') {
      setComments([]);
      setCommentsLoading(false);
      return;
    }
    // If we've already loaded this post's comments before, show them
    // immediately instead of blanking the screen — then quietly refetch
    // in the background to pick up anything new.
    const cached = getCachedComments(post.id);
    if (cached) {
      setComments(cached);
      setCommentsLoading(false);
    } else {
      setCommentsLoading(true);
    }
    fetchComments(post.id).then(({ comments: loaded, hasMore }) => {
      if (!cancelled) {
        setComments(loaded);
        setCommentsOffset(loaded.length);
        setHasMoreComments(!!hasMore);
        setCommentsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [post?.id, fetchComments, getCachedComments]);

  function handleLoadMoreComments() {
    if (!post || loadingMoreComments) return;
    setLoadingMoreComments(true);
    fetchComments(post.id, { offset: commentsOffset }).then(({ comments: loaded, hasMore }) => {
      setComments((prev) => [...prev, ...loaded]);
      setCommentsOffset((prev) => prev + loaded.length);
      setHasMoreComments(!!hasMore);
      setLoadingMoreComments(false);
    });
  }

  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (recording && recordSeconds >= MAX_RECORD_SECONDS) sendRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, recordSeconds]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  // Names available for @mention — the post author plus everyone who has
  // commented or replied so far.
  const mentionCandidates = useMemo(() => {
    const names = new Set();
    const postAuthorName = post ? (post.author || userById(post.uid))?.name : null;
    if (postAuthorName) names.add(postAuthorName);
    function walk(list) {
      list.forEach((c) => {
        const n = (c.author || userById(c.uid))?.name;
        if (n) names.add(n);
        if (c.replies) walk(c.replies);
      });
    }
    walk(comments);
    return Array.from(names);
  }, [comments, post]);

  const mentionMatches =
    mentionQuery !== null
      ? mentionCandidates
          .filter((n) => n.toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : [];

  if (!post) {
    return (
      <div className={styles.notFound}>
        <i className="ri-file-search-line" />
        <p>Chapisho halipatikani.</p>
        <button className="btnAccent" onClick={() => router.push('/feed')}>
          Rudi Mlishoni
        </button>
      </div>
    );
  }

  const author = post.author || userById(post.uid);
  const { text: postText, feeling } = parsePostText(post.text);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const isColorOnly = images.length === 1 && (!isImageUrl(images[0]) || isTemplateImage(images[0]));
  const photoImages = images.filter((img) => isImageUrl(img) && !isTemplateImage(img));
  const liked = !!likes[post.id];
  const likeCount = post.likes + (liked ? 1 : 0);
  const isOwner = !!user && post.uid === user.id;

  async function handleDeletePost() {
    setMenuOpen(false);
    if (!window.confirm('Una uhakika unataka kufuta chapisho hili?')) return;
    setDeleting(true);
    const { error } = await deletePost(post.id);
    setDeleting(false);
    if (!error) router.push('/feed');
  }

  function handleEditPost() {
    setMenuOpen(false);
    setEditing(true);
  }

  function handleViewProfile() {
    setMenuOpen(false);
    router.push('/profile');
  }

  function openLightbox(photoIndex) {
    setLightboxIndex(Math.max(0, photoIndex));
    setLightboxOpen(true);
  }

  function handleCommentChange(e) {
    const value = e.target.value;
    const caret = e.target.selectionStart ?? value.length;
    setComment(value);
    setMentionQuery(mentionQueryAt(value, caret));
  }

  function selectMention(name) {
    const input = commentInputRef.current;
    const caret = input ? input.selectionStart ?? comment.length : comment.length;
    const before = comment.slice(0, caret);
    const after = comment.slice(caret);
    const replacedBefore = before.replace(/(?:^|\s)@([a-zA-Z0-9_]*)$/, (m) =>
      (m.startsWith(' ') ? ' ' : '') + `@${name} `
    );
    setComment(replacedBefore + after);
    setMentionQuery(null);
    requestAnimationFrame(() => input?.focus());
  }

  // Tapping "Jibu" on any comment (top-level or reply) reuses this one
  // composer instead of opening a duplicate reply box — it just tags the
  // reply target and drops an @mention into the shared input.
  function startReply(target, rootId) {
    const name = (target.author || userById(target.uid))?.name || 'Mtumiaji';
    setReplyTarget({ rootId, label: name });
    setComment(`@${name} `);
    setMentionQuery(null);
    requestAnimationFrame(() => commentInputRef.current?.focus());
  }

  function cancelReply() {
    setReplyTarget(null);
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      recordedChunksRef.current = [];

      // The default Opus bitrate (~128kbps) is built for music, not a voice
      // note — 24kbps mono is still clearly intelligible speech at roughly
      // 1/5th the size. Fall back to no options if the browser rejects them.
      let recorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 24000,
        });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          setRecordedBytes((b) => b + e.data.size);
        }
      };
      mediaRecorderRef.current = recorder;
      // timeslice of 1s so we get a running byte count while recording, not
      // just one chunk at the very end.
      recorder.start(1000);
      setRecordSeconds(0);
      setRecordedBytes(0);
      setRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.warn('Haiwezi kufikia maikrofoni:', err.message);
    }
  }

  function stopRecordingTracks() {
    clearInterval(recordTimerRef.current);
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    setRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }
    recordedChunksRef.current = [];
    stopRecordingTracks();
  }

  function sendRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    const elapsedSeconds = recordSeconds;
    recorder.onstop = async () => {
      stopRecordingTracks();
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      recordedChunksRef.current = [];
      if (blob.size === 0) return;

      setSendingVoice(true);

      // Prefer the real duration read off the recorded file's own metadata;
      // the elapsed-seconds timer is just a fallback (e.g. under 1s clips,
      // where the interval hasn't ticked yet, would otherwise show 0:00).
      const measured = await getBlobDuration(blob);
      const duration = measured ? Math.round(measured) : Math.max(1, elapsedSeconds);

      const { error: uploadError, url } = await uploadVoiceNote(blob);
      if (uploadError || !url) {
        setSendingVoice(false);
        console.warn('Imeshindwa kupakia sauti:', uploadError?.message);
        return;
      }

      const parentId = replyTarget ? replyTarget.rootId : null;
      const mentionText = replyTarget ? `@${replyTarget.label} ` : '';
      const { error, comment: newComment } = await addComment(post.id, mentionText, parentId, {
        url,
        duration,
      });
      setSendingVoice(false);
      if (error || !newComment) return;

      if (parentId) {
        setComments((list) =>
          list.map((c) => (c.id === parentId ? { ...c, replies: [newComment, ...(c.replies || [])] } : c))
        );
        setOpenReplies((r) => ({ ...r, [parentId]: true }));
      } else {
        setComments((list) => [newComment, ...list]);
      }
      setReplyTarget(null);
    };
    recorder.stop();
  }

  async function handleSendComment() {
    const text = comment.trim();
    if (!text || posting) return;
    setPosting(true);
    const parentId = replyTarget ? replyTarget.rootId : null;
    const { error, comment: newComment } = await addComment(post.id, text, parentId);
    setPosting(false);
    if (error || !newComment) return;

    if (parentId) {
      setComments((list) =>
        list.map((c) => (c.id === parentId ? { ...c, replies: [newComment, ...(c.replies || [])] } : c))
      );
      setOpenReplies((r) => ({ ...r, [parentId]: true }));
    } else {
      setComments((list) => [newComment, ...list]);
    }
    setComment('');
    setReplyTarget(null);
    setMentionQuery(null);
  }

  async function handleDeleteComment(target, isReply) {
    if (!window.confirm('Futa maoni haya?')) return;
    const removedCount = isReply ? 1 : 1 + (target.replies ? target.replies.length : 0);
    const { error } = await deleteComment(target.id, post.id, removedCount);
    if (error) return;

    setComments((list) => {
      if (isReply) {
        return list.map((c) =>
          c.replies && c.replies.some((r) => r.id === target.id)
            ? { ...c, replies: c.replies.filter((r) => r.id !== target.id) }
            : c
        );
      }
      return list.filter((c) => c.id !== target.id);
    });
  }

  function toggleReplies(id) {
    setOpenReplies((r) => ({ ...r, [id]: !r[id] }));
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <Link href={isOwner ? '/profile' : `/u/${post.uid}`} className={styles.who}>
          <Avatar emoji={author.avatar} src={author.avatarUrl} alt={author.name} />
          <div className={styles.whoText}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{author.name}</span>
              <UserBadge badge={author.badge} iconOnly={author.badge === 'business'} />
            </div>
            <span className={styles.meta}>
              {post.time} · {post.tag}
              {author.badge === 'business' && author.businessCategory ? ` · ${author.businessCategory}` : ''}
            </span>
          </div>
        </Link>
        {!isOwner && author.badge === 'business' && author.whatsapp && (
          <a
            href={`https://wa.me/${author.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.headMoreBtn} ${styles.contactBtnWhatsapp}`}
            aria-label="Wasiliana WhatsApp"
          >
            <i className="ri-whatsapp-line" />
          </a>
        )}
        {!isOwner && author.badge === 'business' && author.businessPhone && (
          <a href={`tel:+${author.businessPhone}`} className={styles.headMoreBtn} aria-label="Piga Simu">
            <i className="ri-phone-line" />
          </a>
        )}
        {!isOwner && user && (
          <FollowBtn
            following={isFollowing(post.uid)}
            pending={!!pending[post.uid]}
            small
            onClick={() => handleFollowClick(post.uid)}
          />
        )}
        {isOwner && (
          <button
            type="button"
            className={styles.headMoreBtn}
            onClick={handleViewProfile}
            aria-label="Wasifu wangu"
          >
            <i className="ri-user-line" />
          </button>
        )}
        {isOwner && (
          <div className={styles.headMenuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.headMoreBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Chaguo za chapisho"
            >
              <i className={deleting ? 'ri-loader-4-line' : 'ri-more-fill'} />
            </button>
            {menuOpen && (
              <div className={styles.headMenu}>
                <button type="button" className={styles.headMenuItem} onClick={handleEditPost}>
                  <i className="ri-edit-line" />
                  Hariri Chapisho
                </button>
                <button type="button" className={styles.headMenuItemDanger} onClick={handleDeletePost}>
                  <i className="ri-delete-bin-line" />
                  Futa Chapisho
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/*
        Everything below the header scrolls together as one natural page —
        post media, text, actions, and the full comments list all in one
        flow. The old approach hid the image on scroll to "make room," which
        needed a scroll listener guessing at direction/overflow and kept
        producing race conditions on short comment lists. This way there's
        nothing to guess: scrolling down naturally moves the image out of
        view and comments get the full viewport, with no listener at all.

        On wider screens (see page.module.css, 900px+) bodyWrap switches to
        a two-column grid instead: media+tags stay on the left, comments +
        the composer move to the right with the composer pinned to the
        bottom of that column. .scrollArea becomes `display:contents` at
        that breakpoint so .top and .commentsSection can sit in separate
        grid columns without changing this markup.
      */}
      <div className={styles.bodyWrap}>
      <div className={styles.scrollArea}>
        <div className={styles.top}>
          {images.length > 1 ? (
            <div className={styles.carouselWrap}>
              <div className={styles.carousel} onScroll={handleScroll}>
                {images.map((bg, i) =>
                  isImageUrl(bg) ? (
                    <div
                      key={i}
                      className={styles.media}
                      onClick={() => openLightbox(photoImages.indexOf(bg))}
                      role="button"
                      tabIndex={0}
                      aria-label="Panua picha"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bg} alt="" className={styles.mediaImg} />
                      <i className={`ri-fullscreen-line ${styles.expandHint}`} />
                    </div>
                  ) : (
                    <div key={i} className={`${styles.media} texture`} style={{ background: bg }}>
                      <i className="ri-image-line" />
                    </div>
                  )
                )}
              </div>
              <div className={styles.topLeftRow}>
                <span className={styles.mediaTag}>{post.tag}</span>
                {feeling && (
                  <span className={styles.feelingBadge}>
                    <Emoji emoji={feeling.emoji} /> Anasikia {feeling.label}
                  </span>
                )}
              </div>
              <span className={styles.count}>{active + 1}/{images.length}</span>
              <div className={styles.dots}>
                {images.map((_, i) => (
                  <span key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} />
                ))}
              </div>
            </div>
          ) : images.length === 1 ? (
            isImageUrl(images[0]) ? (
              <div
                className={styles.media}
                onClick={() => !isTemplateImage(images[0]) && openLightbox(0)}
                role={!isTemplateImage(images[0]) ? 'button' : undefined}
                tabIndex={!isTemplateImage(images[0]) ? 0 : undefined}
                aria-label={!isTemplateImage(images[0]) ? 'Panua picha' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt="" className={styles.mediaImg} />
                {isTemplateImage(images[0]) && <TwemojiText as="p" className={styles.mediaText} text={postText} />}
                {!isTemplateImage(images[0]) && <i className={`ri-fullscreen-line ${styles.expandHint}`} />}
                <div className={styles.topLeftRow}>
                  <span className={styles.mediaTag}>{post.tag}</span>
                  {feeling && (
                    <span className={styles.feelingBadge}>
                      <Emoji emoji={feeling.emoji} /> Anasikia {feeling.label}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${styles.media} texture`} style={{ background: images[0] }}>
                <div className={styles.topLeftRow}>
                  <span className={styles.mediaTag}>{post.tag}</span>
                  {feeling && (
                    <span className={styles.feelingBadge}>
                      <Emoji emoji={feeling.emoji} /> Anasikia {feeling.label}
                    </span>
                  )}
                </div>
                <TwemojiText as="p" className={styles.mediaText} text={postText} />
              </div>
            )
          ) : null}

          <div className={styles.topBody}>
            {!isColorOnly && feeling && images.length === 0 && (
              <span className={styles.feelingChip}>
                <Emoji emoji={feeling.emoji} /> Anasikia {feeling.label}
              </span>
            )}
            {!isColorOnly && <TwemojiText as="p" className={styles.text} text={postText} />}

            {post.cta && (
              post.cta.url ? (
                <a
                  href={post.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btnAccent ${styles.cta}`}
                >
                  <i className={post.cta.icon || 'ri-arrow-right-line'} />
                  <span className={styles.ctaLabel}>{post.cta.label}</span>
                </a>
              ) : (
                <button type="button" className={`btnAccent ${styles.cta}`} disabled>
                  <i className={post.cta.icon || 'ri-arrow-right-line'} />
                  <span className={styles.ctaLabel}>{post.cta.label}</span>
                </button>
              )
            )}

            {post.price != null && (
              <div style={{ marginTop: 4 }}>
                <AddToCartButton post={post} />
              </div>
            )}

            <div className={styles.actions}>
              <div className={styles.actionsLeft}>
                <button
                  className={`${styles.action} ${liked ? styles.liked : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <i className={liked ? 'ri-heart-fill' : 'ri-heart-line'} />
                  {likeCount}
                </button>
                <span className={styles.action}>
                  <i className="ri-chat-3-line" />
                  {post.comments || 0}
                </span>
              </div>
              <button
                className={`${styles.action} ${styles.spacer}`}
                aria-label="Sambaza"
                onClick={() => setSharing(true)}
              >
                <i className="ri-share-forward-line" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.commentsSection}>
          <p className={styles.commentsTitle}>Maoni</p>
          <div className={styles.commentsList}>
            {commentsLoading ? (
              <div className={styles.commentsSkeleton} aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={styles.comment}>
                    <div className={styles.skelAvatar} />
                    <div className={styles.commentBody}>
                      <div className={styles.skelBubble} style={{ width: i === 1 ? '70%' : '90%' }} />
                      <div className={styles.skelMeta} />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className={styles.meta}>Hakuna maoni bado. Kuwa wa kwanza kutoa maoni.</p>
            ) : (
              comments.map((c) => {
                const cu = c.author || userById(c.uid);
                const canDelete = !!user && c.uid === user.id;
                const hasReplies = c.replies && c.replies.length > 0;
                const repliesOpen = !!openReplies[c.id];
                return (
                  <div key={c.id} className={styles.comment}>
                    <Avatar emoji={cu.avatar} src={cu.avatarUrl} size={32} />
                    <div className={styles.commentBody}>
                      <div className={styles.commentBubble}>
                        <Link
                          href={c.uid === user?.id ? '/profile' : `/u/${c.uid}`}
                          className={styles.commentNameLink}
                        >
                          <span className={styles.commentName}>{cu.name}</span>
                        </Link>
                        {c.audioUrl ? (
                          <>
                            {c.text && <p className={styles.commentText}>{renderWithMentions(c.text)}</p>}
                            <VoiceNote src={c.audioUrl} duration={c.audioDuration} />
                          </>
                        ) : (
                          <p className={styles.commentText}>{renderWithMentions(c.text)}</p>
                        )}
                      </div>
                      <div className={styles.commentMeta}>
                        <span>{c.time}</span>
                        <button
                          type="button"
                          className={styles.commentLike}
                          onClick={() => startReply(c, c.id)}
                        >
                          Jibu
                        </button>
                        {!!user && c.uid !== user.id && !isFollowing(c.uid) && (
                          <button
                            type="button"
                            className={styles.commentFollow}
                            disabled={!!pending[c.uid]}
                            onClick={() => handleFollowClick(c.uid)}
                          >
                            Fuata
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className={styles.commentDelete}
                            onClick={() => handleDeleteComment(c, false)}
                            aria-label="Futa maoni"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        )}
                      </div>

                      {hasReplies && (
                        <>
                          <button
                            type="button"
                            className={styles.viewReplies}
                            onClick={() => toggleReplies(c.id)}
                          >
                            <i className="ri-corner-down-right-line" />
                            {repliesOpen ? 'Ficha majibu' : `Ona majibu (${c.replies.length})`}
                          </button>

                          {repliesOpen && (
                            <div className={styles.repliesList}>
                              {c.replies.map((r) => {
                                const ru = r.author || userById(r.uid);
                                const canDeleteReply = !!user && r.uid === user.id;
                                return (
                                  <div key={r.id} className={styles.comment}>
                                    <Avatar emoji={ru.avatar} src={ru.avatarUrl} size={26} />
                                    <div className={styles.commentBody}>
                                      <div className={styles.commentBubble}>
                                        <Link
                                          href={r.uid === user?.id ? '/profile' : `/u/${r.uid}`}
                                          className={styles.commentNameLink}
                                        >
                                          <span className={styles.commentName}>{ru.name}</span>
                                        </Link>
                                        {r.audioUrl ? (
                                          <>
                                            {r.text && (
                                              <p className={styles.commentText}>{renderWithMentions(r.text)}</p>
                                            )}
                                            <VoiceNote src={r.audioUrl} duration={r.audioDuration} />
                                          </>
                                        ) : (
                                          <p className={styles.commentText}>{renderWithMentions(r.text)}</p>
                                        )}
                                      </div>
                                      <div className={styles.commentMeta}>
                                        <span>{r.time}</span>
                                        <button
                                          type="button"
                                          className={styles.commentLike}
                                          onClick={() => startReply(r, c.id)}
                                        >
                                          Jibu
                                        </button>
                                        {!!user && r.uid !== user.id && !isFollowing(r.uid) && (
                                          <button
                                            type="button"
                                            className={styles.commentFollow}
                                            disabled={!!pending[r.uid]}
                                            onClick={() => handleFollowClick(r.uid)}
                                          >
                                            Fuata
                                          </button>
                                        )}
                                        {canDeleteReply && (
                                          <button
                                            type="button"
                                            className={styles.commentDelete}
                                            onClick={() => handleDeleteComment(r, true)}
                                            aria-label="Futa maoni"
                                          >
                                            <i className="ri-delete-bin-line" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {!commentsLoading && hasMoreComments && (
              <button
                type="button"
                className={styles.loadMoreComments}
                onClick={handleLoadMoreComments}
                disabled={loadingMoreComments}
              >
                {loadingMoreComments ? 'Inapakia…' : 'Onyesha maoni zaidi'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.composerWrap}>
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div className={styles.mentionList}>
            {mentionMatches.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.mentionItem}
                onClick={() => selectMention(name)}
              >
                @{name}
              </button>
            ))}
          </div>
        )}

        {replyTarget && (
          <div className={styles.replyBanner}>
            <span>
              Unajibu <b>@{replyTarget.label}</b>
            </span>
            <button type="button" onClick={cancelReply} aria-label="Ghairi jibu">
              <i className="ri-close-line" />
            </button>
          </div>
        )}

        {recording ? (
          <div className={styles.recordingWrap}>
            <div className={styles.recordProgress}>
              <div
                className={styles.recordProgressFill}
                style={{ width: `${Math.min(1, recordSeconds / MAX_RECORD_SECONDS) * 100}%` }}
              />
            </div>
            <div className={styles.composer}>
              <button
                type="button"
                className={styles.recordCancel}
                onClick={cancelRecording}
                disabled={sendingVoice}
                aria-label="Ghairi sauti"
              >
                <i className="ri-delete-bin-line" />
              </button>
              <div className={styles.recordingIndicator}>
                <span className={styles.recordDot} />
                {sendingVoice ? (
                  'Inatuma…'
                ) : (
                  <>
                    <span>{formatRecordTime(recordSeconds)}</span>
                    <span className={styles.recordSize}>{formatBytes(recordedBytes)}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                className={styles.send}
                onClick={sendRecording}
                disabled={sendingVoice}
                aria-label="Tuma sauti"
              >
                <i className={sendingVoice ? 'ri-loader-4-line' : 'ri-check-line'} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.composer}>
            <Avatar emoji={profile?.avatar || '🐧'} src={profile?.avatar_url} size={32} />
            <input
              ref={commentInputRef}
              className={styles.input}
              placeholder={user ? 'Andika maoni...' : 'Ingia ili kutoa maoni'}
              value={comment}
              onChange={handleCommentChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendComment();
              }}
              disabled={!user || posting}
            />
            <button
              type="button"
              className={styles.micBtn}
              disabled={!user || posting}
              aria-label="Rekodi ujumbe wa sauti"
              onClick={startRecording}
            >
              <i className="ri-mic-line" />
            </button>
            <button
              className={styles.send}
              disabled={!comment.trim() || !user || posting}
              aria-label="Tuma"
              onClick={handleSendComment}
            >
              <i className={posting ? 'ri-loader-4-line' : 'ri-send-plane-fill'} />
            </button>
          </div>
        )}
      </div>
      </div>

      {editing && (
        <EditPostModal
          post={post}
          onClose={() => setEditing(false)}
          onSave={(updates) => updatePost(post.id, updates)}
        />
      )}

      {sharing && (
        <ShareCard
          post={post}
          author={author}
          previewImg={images[0]}
          snippetText={postText}
          onClose={() => setSharing(false)}
        />
      )}

      {lightboxOpen && photoImages.length > 0 && (
        <div className={styles.lightbox} onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label="Funga"
          >
            <i className="ri-close-line" />
          </button>

          {photoImages.length > 1 && (
            <span className={styles.lightboxCount}>{lightboxIndex + 1}/{photoImages.length}</span>
          )}

          <div className={styles.lightboxStage} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoImages[lightboxIndex]} alt="" className={styles.lightboxImg} />
          </div>

          {photoImages.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i - 1 + photoImages.length) % photoImages.length);
                }}
                aria-label="Picha iliyopita"
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i + 1) % photoImages.length);
                }}
                aria-label="Picha inayofuata"
              >
                <i className="ri-arrow-right-s-line" />
              </button>
              <div className={styles.lightboxDots}>
                {photoImages.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.lightboxDot} ${i === lightboxIndex ? styles.lightboxDotActive : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
