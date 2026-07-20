'use client'
import { useState } from 'react'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import ShareCard from './ShareCard'
import { userById, commentsForPost } from '../lib/mockData'
import { parsePostText } from '../lib/postText'
import styles from './PostViewer.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

export default function PostViewer({ post, liked, likeCount, onLike, onClose }) {
  const user = post.author || userById(post.uid);
  const { text: postText, feeling } = parsePostText(post.text);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const [active, setActive] = useState(0);
  const [comment, setComment] = useState('');
  const [imageHidden, setImageHidden] = useState(false);
  const [openReplies, setOpenReplies] = useState({});
  const [sharing, setSharing] = useState(false);
  const comments = commentsForPost(post);

  function toggleReplies(id) {
    setOpenReplies((r) => ({ ...r, [id]: !r[id] }));
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  function handleCommentsScroll(e) {
    const hidden = e.currentTarget.scrollTop > 4;
    setImageHidden((v) => (v === hidden ? v : hidden));
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.head}>
          <button className={styles.close} onClick={onClose} aria-label="Rudi nyuma">
            <i className="ri-arrow-left-line" />
          </button>
          <div className={styles.who}>
            <Avatar emoji={user.avatar} src={user.avatarUrl} alt={user.name} />
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
            {feeling && (
              <span className={styles.feelingChip}>
                {feeling.emoji} Anasikia {feeling.label}
              </span>
            )}
            <p className={styles.text}>{postText}</p>

            {post.cta && (
              <button className={`btnAccent ${styles.cta}`}>
                <i className={post.cta.icon || 'ri-arrow-right-line'} />
                {post.cta.label}
              </button>
            )}

            <div className={styles.actions}>
              <button
                className={`${styles.action} ${liked ? styles.liked : ''}`}
                onClick={onLike}
              >
                <i className={liked ? 'ri-heart-fill' : 'ri-heart-line'} />
                {likeCount}
              </button>
              <span className={styles.action}>
                <i className="ri-chat-3-line" />
                {comments.length}
              </span>
              <button
                className={`${styles.action} ${styles.spacer}`}
                onClick={() => setSharing(true)}
                aria-label="Sambaza"
              >
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
                            <i className={repliesOpen ? 'ri-corner-down-right-line' : 'ri-corner-down-right-line'} />
                            {repliesOpen
                              ? 'Ficha majibu'
                              : `Ona majibu (${c.replies.length})`}
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

      {sharing && (
        <ShareCard
          post={post}
          author={user}
          previewImg={images[0]}
          snippetText={postText}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
