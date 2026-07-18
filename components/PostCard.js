'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import FollowBtn from './FollowBtn'
import EditPostModal from './EditPostModal'
import { useAuth } from './AuthProvider'
import { useAuthModal } from './AuthModalProvider'
import { usePosts } from './PostsProvider'
import { useFollow } from './FollowProvider'
import { userById } from '../lib/mockData'
import { parsePostText } from '../lib/postText'
import styles from './PostCard.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

function isTemplateImage(src) {
  return typeof src === 'string' && src.startsWith('/post-templates/');
}

export default function PostCard({ post, liked, likeCount, onLike }) {
  const author = post.author || userById(post.uid);
  const { text: postText, feeling } = parsePostText(post.text);
  const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
  // Color-background posts (no real photo) show the post text centered
  // inside the color block itself instead of as a caption underneath.
  const isColorOnly = images.length === 1 && (!isImageUrl(images[0]) || isTemplateImage(images[0]));
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const textRef = useRef(null);
  const menuRef = useRef(null);
  const carouselRef = useRef(null);
  const activeRef = useRef(0);
  const scrollEndTimerRef = useRef(null);
  const userInteractingRef = useRef(false);
  const router = useRouter();
  const { user: authUser, profile: authProfile } = useAuth();
  const { openAuth } = useAuthModal();
  const { deletePost, updatePost } = usePosts();
  const { isFollowing, toggleFollow, pending } = useFollow();
  const isOwner = !!authUser && post.uid === authUser.id;
  const authorHref = isOwner ? '/profile' : `/u/${post.uid}`;

  // The fetched likers list is a load-time snapshot, so if the viewer just
  // liked this post themselves, fold their own avatar in at the front
  // (and drop it back out on unlike) rather than waiting on a full reload.
  const baseLikers = post.likers || [];
  const iAmInList = authUser && baseLikers.some((l) => l.uid === authUser.id);
  let displayLikers = baseLikers;
  if (authUser && liked && !iAmInList) {
    displayLikers = [
      {
        uid: authUser.id,
        name: authProfile?.username || 'Wewe',
        avatar: authProfile?.avatar || '🐧',
        avatarUrl: authProfile?.avatar_url || null,
      },
      ...baseLikers,
    ].slice(0, 4);
  } else if (authUser && !liked && iAmInList) {
    displayLikers = baseLikers.filter((l) => l.uid !== authUser.id);
  }
  const extraLikers = Math.max(0, likeCount - displayLikers.length);

  function handleFollowClick(e) {
    e.stopPropagation();
    if (!authUser) {
      openAuth('signin');
      return;
    }
    toggleFollow(post.uid);
  }

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
  }, [postText, expanded]);

  function handleScroll(e) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
    }
    // A scroll event firing means *something* is moving the carousel right
    // now — either the user's finger/momentum or our own auto-scroll call.
    // Treat it as "interacting" for a short debounce window so the two
    // never race and fight over scrollLeft mid-gesture.
    userInteractingRef.current = true;
    scheduleResume();
  }

  // Auto-advance the carousel every few seconds, but only when the user
  // isn't currently mid-scroll/touch — physical scrolling always wins.
  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      if (userInteractingRef.current) return;
      const el = carouselRef.current;
      if (!el) return;
      const next = (activeRef.current + 1) % images.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => () => clearTimeout(scrollEndTimerRef.current), []);

  function markInteracting() {
    userInteractingRef.current = true;
    clearTimeout(scrollEndTimerRef.current);
  }

  function scheduleResume() {
    clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false;
    }, 500);
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

  function handleEdit(e) {
    e.stopPropagation();
    setMenuOpen(false);
    setEditing(true);
  }

  function handleViewProfile(e) {
    e.stopPropagation();
    setMenuOpen(false);
    router.push('/profile');
  }

  const menuEl = isOwner ? (
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
          <button type="button" className={styles.menuItem} onClick={handleViewProfile}>
            <i className="ri-user-line" />
            Angalia Wasifu
          </button>
          <button type="button" className={styles.menuItem} onClick={handleEdit}>
            <i className="ri-edit-line" />
            Hariri Chapisho
          </button>
          <button type="button" className={styles.menuItemDanger} onClick={handleDelete}>
            <i className="ri-delete-bin-line" />
            Futa Chapisho
          </button>
        </div>
      )}
    </div>
  ) : (
    <i className={`ri-more-fill ${styles.more}`} />
  );

  return (
    <div className={`card ${styles.card}`}>
      {images.length > 0 && (
      <div className={styles.mediaWrap}>
      {images.length > 1 ? (
        <div className={styles.carouselWrap} onClick={viewPost}>
          <div
            className={styles.carousel}
            ref={carouselRef}
            onScroll={handleScroll}
            onTouchStart={markInteracting}
            onTouchEnd={scheduleResume}
            onPointerDown={markInteracting}
            onPointerUp={scheduleResume}
          >
            {images.map((bg, i) =>
              isImageUrl(bg) ? (
                <div key={i} className={`${styles.media} ${styles.mediaSlide}`}>
                  {i === 0 && (
                    <div className={styles.topLeftRow}>
                      <span className={styles.mediaTag}>{post.tag}</span>
                      {feeling && (
                        <span className={styles.feelingBadge}>
                          {feeling.emoji} feeling {feeling.label}
                        </span>
                      )}
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg} alt="" className={styles.mediaImg} />
                </div>
              ) : (
                <div key={i} className={`${styles.media} ${styles.mediaSlide} texture`} style={{ background: bg }}>
                  {i === 0 && (
                    <div className={styles.topLeftRow}>
                      <span className={styles.mediaTag}>{post.tag}</span>
                      {feeling && (
                        <span className={styles.feelingBadge}>
                          {feeling.emoji} feeling {feeling.label}
                        </span>
                      )}
                    </div>
                  )}
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
            <div className={styles.topLeftRow}>
              <span className={styles.mediaTag}>{post.tag}</span>
              {feeling && (
                <span className={styles.feelingBadge}>
                  {feeling.emoji} feeling {feeling.label}
                </span>
              )}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className={styles.mediaImg} />
            {isTemplateImage(images[0]) && <p className={styles.mediaText}>{postText}</p>}
          </div>
        ) : (
          <div className={`${styles.media} texture`} style={{ background: images[0] }} onClick={viewPost}>
            <div className={styles.topLeftRow}>
              <span className={styles.mediaTag}>{post.tag}</span>
              {feeling && (
                <span className={styles.feelingBadge}>
                  {feeling.emoji} feeling {feeling.label}
                </span>
              )}
            </div>
            <p className={styles.mediaText}>{postText}</p>
          </div>
        )
      ) : null}

      <div className={styles.actionsRail} onClick={(e) => e.stopPropagation()}>
        {menuEl}
      </div>

      <div className={styles.cornerStack} onClick={(e) => e.stopPropagation()}>
        {displayLikers.length > 0 && (
          <div className={styles.likersStack}>
            {displayLikers.map((l) => (
              <span key={l.uid} className={styles.likerAvatar}>
                {l.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.avatarUrl} alt={l.name} />
                ) : (
                  l.avatar
                )}
              </span>
            ))}
            {extraLikers > 0 && <span className={`${styles.likerAvatar} ${styles.likerMore}`}>+{extraLikers}</span>}
          </div>
        )}

        <div className={styles.actionsPill}>
          <button
            className={`${styles.pillBtn} ${liked ? styles.liked : ''}`}
            onClick={onLike}
          >
            <i className={liked ? 'ri-heart-fill' : 'ri-heart-line'} />
            <span>{likeCount}</span>
          </button>
          <button className={styles.pillBtn} onClick={viewPost}>
            <i className="ri-chat-3-line" />
            <span>{post.comments}</span>
          </button>
          <button className={styles.pillBtn}>
            <i className="ri-share-2-line" />
          </button>
        </div>
      </div>

      {post.cta && (
        <div className={styles.ctaOverlayWrap} onClick={(e) => e.stopPropagation()}>
          {post.cta.url ? (
            <a
              href={post.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaOverlay}
            >
              <i className={post.cta.icon || 'ri-arrow-right-line'} />
              {post.cta.label}
            </a>
          ) : (
            <button type="button" className={styles.ctaOverlay} disabled>
              <i className={post.cta.icon || 'ri-arrow-right-line'} />
              {post.cta.label}
            </button>
          )}
        </div>
      )}
      </div>
      )}

      <div className={styles.body}>
        <div className={styles.header}>
          <Link href={authorHref} className={styles.who} onClick={(e) => e.stopPropagation()}>
            <Avatar emoji={author.avatar} src={author.avatarUrl} alt={author.name} />
            <div>
              <div className={styles.nameRow}>
                <span className={styles.name}>{author.name}</span>
                <UserBadge badge={author.badge} />
              </div>
              <span className={styles.meta}>{post.time} · {post.tag}</span>
            </div>
          </Link>
          <div className={styles.headerActions}>
            {!isOwner && (
              <FollowBtn
                following={isFollowing(post.uid)}
                pending={!!pending[post.uid]}
                small
                onClick={handleFollowClick}
              />
            )}
            {isOwner && images.length > 0 && (
              <button
                type="button"
                className={styles.myProfileBtn}
                onClick={handleViewProfile}
              >
                <i className="ri-user-line" />
                Wasifu Wangu
              </button>
            )}
            {images.length === 0 && menuEl}
          </div>
        </div>

        {!isColorOnly && (
          <div className={styles.textWrap}>
            {feeling && images.length === 0 && (
              <span className={styles.feelingChip}>
                {feeling.emoji} feeling {feeling.label}
              </span>
            )}
            <p
              ref={textRef}
              className={`${styles.text} ${!expanded ? styles.textClamped : ''}`}
            >
              {postText}
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
        )}

        {images.length === 0 && post.cta && (
          post.cta.url ? (
            <a
              href={post.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btnAccent ${styles.cta}`}
              onClick={(e) => e.stopPropagation()}
            >
              <i className={post.cta.icon || 'ri-arrow-right-line'} />
              {post.cta.label}
            </a>
          ) : (
            <button className={`btnAccent ${styles.cta}`} disabled>
              <i className={post.cta.icon || 'ri-arrow-right-line'} />
              {post.cta.label}
            </button>
          )
        )}

        {images.length === 0 && (
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
              <i className="ri-share-2-line" />
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditPostModal
          post={post}
          onClose={() => setEditing(false)}
          onSave={(updates) => updatePost(post.id, updates)}
        />
      )}
    </div>
  );
}
