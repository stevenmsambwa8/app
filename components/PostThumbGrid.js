'use client'
import { useRouter } from 'next/navigation'
import { parsePostText } from '../lib/postText'
import styles from './PostThumbGrid.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

export default function PostThumbGrid({ posts }) {
  const router = useRouter();

  return (
    <div className={styles.grid}>
      {posts.map((post) => {
        const { text } = parsePostText(post.text);
        const images = post.images && post.images.length ? post.images : (post.gradient ? [post.gradient] : []);
        const cover = images[0];
        const hasPhoto = cover && isImageUrl(cover);
        const commentCount = typeof post.comments === 'number' ? post.comments : 0;

        return (
          <button
            type="button"
            key={post.id}
            className={styles.tile}
            onClick={() => router.push(`/post/${post.id}`)}
          >
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className={styles.img} />
            ) : (
              <div
                className={`${styles.fallback} ${cover ? 'texture' : ''}`}
                style={cover ? { background: cover } : undefined}
              >
                <p className={styles.fallbackText}>{text}</p>
              </div>
            )}
            {images.length > 1 && <i className={`ri-stack-line ${styles.stackIcon}`} />}
            <div className={styles.overlay}>
              <span className={styles.stat}>
                <i className="ri-heart-fill" />
                {post.likes || 0}
              </span>
              <span className={styles.stat}>
                <i className="ri-chat-3-fill" />
                {commentCount}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
