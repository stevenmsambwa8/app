'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import { useAuth } from './AuthProvider'
import { usePosts } from './PostsProvider'
import { userById } from '../lib/mockData'
import styles from './PostCard.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^https?:\/\//.test(src);
}

export default function PostCard({ post, liked, likeCount, onLike }) {
  const author = post.author || userById(post.uid);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { deletePost } = usePosts();
  const isOwner = !!authUser && post.uid === authUser.id;

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

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
    router.push(`/post/${post.id}`);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm('Una uhakika unataka kufuta chapisho hili?')) return;
    setDeleting(true);
    await deletePost(post.id);
    setDeleting(false);
  }

  return (
    <div className={`card ${styles.card}`}>
      {images.length > 1 ? (
        <div className={styles.carouselWrap} onClick={viewPost}>
          <div className={styles.carousel} onScroll={handleScroll}>
            {images.map((bg, i) =>
              isImageUrl(bg) ? (
                <div key={i} className={`${styles.media} ${styles.mediaSlide}`}>
                  {i === 0 && <span className={styles.mediaTag}>{post.tag}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg} alt="" className={styles.mediaImg} />
                </div>
              ) : (
                <div key={i} className={`${styles.media} ${styles.mediaSlide} texture`} style={{ background: bg }}>
                  {i === 0 && <span className={styles.mediaTag}>{post.tag}</span>}
                  <i className="ri-image-line" />
                </div>
              )
            )}
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
        isImageUrl(images[0]) ? (
          <div className={styles.media} onClick={viewPost}>
            <span className={styles.mediaTag}>{post.tag}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className={styles.mediaImg} />
          </div>
        ) : (
          <div className={`${styles.media} texture`} style={{ background: images[0] }} onClick={viewPost}>
            <span className={styles.mediaTag}>{post.tag}</span>
            <i className="ri-image-line" />
          </div>
        )
      ) : null}

      <div className={styles.body}>
        <div className={styles.header}>
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
          {isOwner ? (
            <div className={styles.menuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.moreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-label="Chaguo za chapisho"
              >
                <i className={deleting ? 'ri-loader-4-line' : 'ri-more-fill'} />
              </button>
              {menuOpen && (
                <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className={styles.menuItemDanger} onClick={handleDelete}>
                    <i className="ri-delete-bin-line" />
                    Futa Chapisho
                  </button>
                </div>
              )}
            </div>
          ) : (
            <i className={`ri-more-fill ${styles.more}`} />
          )}
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
