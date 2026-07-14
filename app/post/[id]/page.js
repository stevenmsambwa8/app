'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '../../../components/Avatar'
import UserBadge from '../../../components/UserBadge'
import { usePosts } from '../../../components/PostsProvider'
import { userById, commentsForPost } from '../../../lib/mockData'
import styles from './page.module.css'

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { posts, likes, toggleLike } = usePosts();

  const postId = Number(params.id);
  const post = posts.find((p) => p.id === postId && p.kind !== 'ad');

  const [active, setActive] = useState(0);
  const [comment, setComment] = useState('');
  const [imageHidden, setImageHidden] = useState(false);
  const [openReplies, setOpenReplies] = useState({});
  const lastScrollTop = useRef(0);

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

  const user = userById(post.uid);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const liked = !!likes[post.id];
  const likeCount = post.likes + (liked ? 1 : 0);
  const comments = commentsForPost(post);

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  function handleCommentsScroll(e) {
    const el = e.currentTarget;
    const overflow = el.scrollHeight - el.clientHeight;

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

  function toggleReplies(id) {
    setOpenReplies((r) => ({ ...r, [id]: !r[id] }));
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <div className={styles.who}>
          <Avatar emoji={user.avatar} />
          <div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{user.name}</span>
              <UserBadge badge={user.badge} />
            </div>
            <span className={styles.meta}>{post.time} · {post.tag}</span>
          </div>
        </div>
      </div>

      <div className={styles.top}>
        <div className={`${styles.mediaCollapse} ${imageHidden ? styles.mediaCollapsed : ''}`}>
          {images.length > 1 ? (
            <div className={styles.carouselWrap}>
              <div className={styles.carousel} onScroll={handleScroll}>
                {images.map((bg, i) => (
                  <div key={i} className={`${styles.media} texture`} style={{ background: bg }}>
                    <i className="ri-image-line" />
                  </div>
                ))}
              </div>
              <span className={styles.count}>{active + 1}/{images.length}</span>
              <div className={styles.dots}>
                {images.map((_, i) => (
                  <span key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} />
                ))}
              </div>
            </div>
          ) : images.length === 1 ? (
            <div className={`${styles.media} texture`} style={{ background: images[0] }}>
              <i className="ri-image-line" />
            </div>
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
              {comments.length}
            </span>
            <button className={`${styles.action} ${styles.spacer}`}>
              <i className="ri-share-forward-line" />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.commentsScroll} onScroll={handleCommentsScroll}>
        <div className={styles.commentsSection}>
          <p className={styles.commentsTitle}>Maoni</p>
          <div className={styles.commentsList}>
            {comments.map((c) => {
              const cu = userById(c.uid);
              const hasReplies = c.replies && c.replies.length > 0;
              const repliesOpen = !!openReplies[c.id];
              return (
                <div key={c.id} className={styles.comment}>
                  <Avatar emoji={cu.avatar} size={32} />
                  <div className={styles.commentBody}>
                    <div className={styles.commentBubble}>
                      <span className={styles.commentName}>{cu.name}</span>
                      <p className={styles.commentText}>{c.text}</p>
                    </div>
                    <div className={styles.commentMeta}>
                      <span>{c.time}</span>
                      <button className={styles.commentLike}>
                        <i className="ri-heart-line" />
                        {c.likes > 0 ? c.likes : ''}
                      </button>
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
                              const ru = userById(r.uid);
                              return (
                                <div key={r.id} className={styles.comment}>
                                  <Avatar emoji={ru.avatar} size={26} />
                                  <div className={styles.commentBody}>
                                    <div className={styles.commentBubble}>
                                      <span className={styles.commentName}>{ru.name}</span>
                                      <p className={styles.commentText}>{r.text}</p>
                                    </div>
                                    <div className={styles.commentMeta}>
                                      <span>{r.time}</span>
                                      <button className={styles.commentLike}>
                                        <i className="ri-heart-line" />
                                        {r.likes > 0 ? r.likes : ''}
                                      </button>
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
            })}
          </div>
        </div>
      </div>

      <div className={styles.composer}>
        <Avatar emoji={userById(0).avatar} size={32} />
        <input
          className={styles.input}
          placeholder="Andika maoni..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className={styles.send} disabled={!comment.trim()} aria-label="Tuma">
          <i className="ri-send-plane-fill" />
        </button>
      </div>
    </div>
  );
}
