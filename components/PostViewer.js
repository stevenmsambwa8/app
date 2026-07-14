'use client'
import { useState } from 'react'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import { userById, commentsForPost } from '../lib/mockData'
import styles from './PostViewer.module.css'

export default function PostViewer({ post, liked, likeCount, onLike, onClose }) {
  const user = userById(post.uid);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const [active, setActive] = useState(0);
  const [comment, setComment] = useState('');
  const comments = commentsForPost(post);

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
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
          <button className={styles.close} onClick={onClose} aria-label="Funga">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className={styles.scroll}>
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

          <div className={styles.body}>
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
                onClick={onLike}
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

            <div className={styles.commentsSection}>
              <p className={styles.commentsTitle}>Maoni</p>
              <div className={styles.commentsList}>
                {comments.map((c) => {
                  const cu = userById(c.uid);
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
                      </div>
                    </div>
                  );
                })}
              </div>
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
    </div>
  );
}
