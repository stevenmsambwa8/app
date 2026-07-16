'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
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
  const [imageHidden, setImageHidden] = useState(false);
  const [openReplies, setOpenReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [postingReply, setPostingReply] = useState({});
  const lastScrollTop = useRef(0);
  const menuRef = useRef(null);
  const commentsRef = useRef(null);
  // Overflow is measured once, before any media-collapse toggling has had a
  // chance to resize this container. Collapsing the media changes commentsScroll's
  // own height, and re-measuring scrollHeight/clientHeight on every scroll tick
  // fed that resize back into the overflow calc — a loop that made the media
  // flap open/closed. Freezing the baseline here breaks the loop.
  const baselineOverflow = useRef(null);

  useLayoutEffect(() => {
    const el = commentsRef.current;
    if (el) baselineOverflow.current = el.scrollHeight - el.clientHeight;
  }, [commentsLoading, comments]);

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

  async function handleSendComment() {
    const text = comment.trim();
    if (!text || posting) return;
    setPosting(true);
    const { error, comment: newComment } = await addComment(post.id, text);
    setPosting(false);
    if (!error && newComment) {
      setComments((c) => [...c, newComment]);
      setComment('');
    }
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

  async function handleSendReply(parent) {
    const text = (replyDrafts[parent.id] || '').trim();
    if (!text || postingReply[parent.id]) return;
    setPostingReply((p) => ({ ...p, [parent.id]: true }));
    const { error, comment: newReply } = await addComment(post.id, text, parent.id);
    setPostingReply((p) => ({ ...p, [parent.id]: false }));
    if (!error && newReply) {
      setComments((list) =>
        list.map((c) => (c.id === parent.id ? { ...c, replies: [...(c.replies || []), newReply] } : c))
      );
      setReplyDrafts((d) => ({ ...d, [parent.id]: '' }));
      setOpenReplies((r) => ({ ...r, [parent.id]: true }));
    }
  }

  function countAllComments(list) {
    return list.reduce((sum, c) => sum + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  function handleCommentsScroll(e) {
    const el = e.currentTarget;
    // Use the height captured before the first collapse, not a live
    // recomputation — see baselineOverflow above for why.
    const overflow = baselineOverflow.current ?? (el.scrollHeight - el.clientHeight);

    // Not enough content to actually scroll — keep media visible, don't react to bounce/noise.
    if (overflow < 24) {
      lastScrollTop.current = 0;
      setImageHidden(false);
      return;
    }

    const top = Math.max(0, el.scrollTop);
    const prev = lastScrollTop.current;
    const delta = top - prev;
    lastScrollTop.current = top;

    if (top <= 0) {
      setImageHidden(false);
      return;
    }
    // Ignore tiny jitters (momentum/rubber-band noise) so it doesn't flicker.
    if (Math.abs(delta) < 6) return;

    if (delta > 0) {
      setImageHidden(true);
    } else {
      setImageHidden(false);
    }
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

      <div className={styles.top}>
        <div className={`${styles.mediaCollapse} ${imageHidden ? styles.mediaCollapsed : ''}`}>
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
        </div>

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

      <div className={styles.commentsScroll} ref={commentsRef} onScroll={handleCommentsScroll}>
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
                          onClick={() => setOpenReplies((r) => ({ ...r, [`reply-${c.id}`]: !r[`reply-${c.id}`] }))}
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

                      {openReplies[`reply-${c.id}`] && (
                        <div className={styles.replyComposer}>
                          <input
                            className={styles.replyInput}
                            placeholder={user ? 'Jibu maoni haya...' : 'Ingia ili kujibu'}
                            value={replyDrafts[c.id] || ''}
                            onChange={(e) => setReplyDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendReply(c);
                            }}
                            disabled={!user || postingReply[c.id]}
                          />
                          <button
                            type="button"
                            className={styles.send}
                            disabled={!user || !(replyDrafts[c.id] || '').trim() || postingReply[c.id]}
                            onClick={() => handleSendReply(c)}
                            aria-label="Tuma jibu"
                          >
                            <i className={postingReply[c.id] ? 'ri-loader-4-line' : 'ri-send-plane-fill'} />
                          </button>
                        </div>
                      )}

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

      <div className={styles.composer}>
        <Avatar emoji={profile?.avatar || '🐧'} src={profile?.avatar_url} size={32} />
        <input
          className={styles.input}
          placeholder={user ? 'Andika maoni...' : 'Ingia ili kutoa maoni'}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
  );
}
