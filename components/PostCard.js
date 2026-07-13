'use client'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import { userById } from '../lib/mockData'
import styles from './PostCard.module.css'

export default function PostCard({ post, liked, likeCount, onLike }) {
  const user = userById(post.uid);
  return (
    <div className={`card ${styles.card}`}>
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

      <p className={styles.text}>{post.text}</p>

      {post.gradient && (
        <div className={`${styles.media} texture`} style={{ background: post.gradient }}>
          <span className={styles.mediaTag}>{post.tag}</span>
          <i className="ri-image-line" />
        </div>
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
          {post.comments}
        </span>
        <button className={`${styles.action} ${styles.spacer}`}>
          <i className="ri-share-forward-line" />
        </button>
      </div>
    </div>
  );
}
