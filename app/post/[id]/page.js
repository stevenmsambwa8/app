'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '../../../components/Avatar'
import UserBadge from '../../../components/UserBadge'
import { usePosts } from '../../../components/PostsProvider'
import { useAuth } from '../../../components/AuthProvider'
import { userById } from '../../../lib/mockData'
import styles from './page.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^https?:\/\//.test(src);
}

// Matches an in-progress "@word" right at the cursor, e.g. typing "...hi @za"
// while the caret sits right after the "za" — used to drive the mention
// suggestion dropdown.
function mentionQueryAt(value, caret) {
  const upToCaret = value.slice(0, caret);
  const match = upToCaret.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  return match ? match[1] : null;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { posts, likes, toggleLike, deletePost, fetchComments, addComment, deleteComment } = usePosts();
  const { user, profile } = useAuth();

  const post = posts.find((p) => String(p.id) === String(params.id) && p.kind !== 'ad');

  const [active, setActive] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openReplies, setOpenReplies] = useState({});
  // { rootId, label } — rootId is the top-level comment this reply attaches
  // to (replies are one level deep), label is who's shown in "Unajibu @Name".
  const [replyTarget, setReplyTarget] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const menuRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!post || typeof post.id !== 'string') {
      setComments([]);
      setCommentsLoading(false);
      return;
    }
    setCommentsLoading(true);
    fetchComments(post.id).then(({ comments: loaded }) => {
      if (!cancelled) {
        setComments(loaded);
        setCommentsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [post?.id, fetchComments]);

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
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
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
        list.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c))
      );
      setOpenReplies((r) => ({ ...r, [parentId]: true }));
    } else {
      setComments((list) => [...list, newComment]);
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

  function countAllComments(list) {
    return list.reduce((sum, c) => sum + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
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
        <div className={styles.who}>
          <Avatar emoji={author.avatar} src={author.avatarUrl} alt={author.name} />
          <div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{author.name}</span>
              <UserBadge badge={author.badge} />
            </div>
            <span className={styles.meta}>{post.time} · {post.tag}</span>
          </div>
        </div>
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
      */}
      <div className={styles.scrollArea}>
        <div className={styles.top}>
          {images.length > 1 ? (
            <div className={styles.carouselWrap}>
              <div className={styles.carousel} onScroll={handleScroll}>
                {images.map((bg, i) =>
                  isImageUrl(bg) ? (
                    <div key={i} className={styles.media}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bg} alt="" className={styles.mediaImg} />
                    </div>
                  ) : (
                    <div key={i} className={`${styles.media} texture`} style={{ background: bg }}>
                      <i className="ri-image-line" />
                    </div>
                  )
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
              <div className={styles.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt="" className={styles.mediaImg} />
              </div>
            ) : (
              <div className={`${styles.media} texture`} style={{ background: images[0] }}>
                <i className="ri-image-line" />
              </div>
            )
          ) : null}

          <div className={styles.topBody}>
            <p className={styles.text}>{post.text}</p>

            {post.cta && (
              <button className={`btnAccent ${styles.cta}`}>
                <i className={post.cta.icon || 'ri-arrow-right-line'} />
                {post.cta.label}
              </button>
            )}

            <div className={styles.actions}>
              <button
                className={`${styles.action} ${liked ? styles.liked : ''}`}
                onClick={() => toggleLike(post.id)}
              >
                <i className={liked ? 'ri-heart-fill' : 'ri-heart-line'} />
                {likeCount}
              </button>
              <span className={styles.action}>
                <i className="ri-chat-3-line" />
                {countAllComments(comments)}
              </span>
              <button className={`${styles.action} ${styles.spacer}`}>
                <i className="ri-share-forward-line" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.commentsSection}>
          <p className={styles.commentsTitle}>Maoni</p>
          <div className={styles.commentsList}>
            {commentsLoading ? (
              <p className={styles.meta}>Inapakia maoni…</p>
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
                        <span className={styles.commentName}>{cu.name}</span>
                        <p className={styles.commentText}>{c.text}</p>
                      </div>
                      <div className={styles.commentMeta}>
                        <span>{c.time}</span>
                        <button
                          type="button"
                          className={styles.commentLike}
                          onClick={() => startReply(c, c.id)}
                        >
                          <i className="ri-reply-line" />
                          Jibu
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className={styles.commentLike}
                            onClick={() => handleDeleteComment(c, false)}
                          >
                            <i className="ri-delete-bin-line" />
                            Futa
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
                                        <span className={styles.commentName}>{ru.name}</span>
                                        <p className={styles.commentText}>{r.text}</p>
                                      </div>
                                      <div className={styles.commentMeta}>
                                        <span>{r.time}</span>
                                        <button
                                          type="button"
                                          className={styles.commentLike}
                                          onClick={() => startReply(r, c.id)}
                                        >
                                          <i className="ri-reply-line" />
                                          Jibu
                                        </button>
                                        {canDeleteReply && (
                                          <button
                                            type="button"
                                            className={styles.commentLike}
                                            onClick={() => handleDeleteComment(r, true)}
                                          >
                                            <i className="ri-delete-bin-line" />
                                            Futa
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
            className={styles.send}
            disabled={!comment.trim() || !user || posting}
            aria-label="Tuma"
            onClick={handleSendComment}
          >
            <i className={posting ? 'ri-loader-4-line' : 'ri-send-plane-fill'} />
          </button>
        </div>
      </div>
    </div>
  );
}
