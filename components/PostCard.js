'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import { userById } from '../lib/mockData'
import { usePostViewer } from './PostViewerProvider'
import styles from './PostCard.module.css'

export default function PostCard({ post, liked, likeCount, onLike }) {
  const user = userById(post.uid);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef(null);
  const { openPost } = usePostViewer();

  useLayoutEffect(() => {
    const el = textRef.current;
    if (el && !expanded) {
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [post.text, expanded]);

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  function viewPost() {
    openPost(post, { liked, likeCount, onLike });
  }

  return (
    <div className={`card ${styles.card}`}>
      {images.length > 1 ? (
        <div className={styles.carouselWrap} onClick={viewPost}>
          <div className={styles.carousel} onScroll={handleScroll}>
            {images.map((bg, i) => (
              <div key={i} className={`${styles.media} ${styles.mediaSlide} texture`} style={{ background: bg }}>
                {i === 0 && <span className={styles.mediaTag}>{post.tag}</span>}
                <i className="ri-image-line" />
              </div>
            ))}
          </div>
          <span className={styles.count}>
            {active + 1}/{images.length}
          </span>
          <div className={styles.dots}>
            {images.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} />
            ))}
          </div>
        </div>
      ) : images.length === 1 ? (
        <div className={`${styles.media} texture`} style={{ background: images[0] }} onClick={viewPost}>
          <span className={styles.mediaTag}>{post.tag}</span>
          <i className="ri-image-line" />
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.header}>
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
          <i className={`ri-more-fill ${styles.more}`} />
        </div>

        <div className={styles.textWrap}>
          <p
            ref={textRef}
            className={`${styles.text} ${!expanded ? styles.textClamped : ''}`}
          >
            {post.text}
          </p>
          {!expanded && clamped && (
            <button
              type="button"
              className={styles.readMoreInline}
              onClick={() => setExpanded(true)}
            >
              Soma Zaidi
            </button>
          )}
          {expanded && (
            <button
              type="button"
              className={styles.readMore}
              onClick={() => setExpanded(false)}
            >
              Ficha
            </button>
          )}
        </div>

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
          <button className={styles.action} onClick={viewPost}>
            <i className="ri-chat-3-line" />
            {post.comments}
          </button>
          <button className={`${styles.action} ${styles.spacer}`}>
            <i className="ri-share-forward-line" />
          </button>
        </div>
      </div>
    </div>
  );
}
