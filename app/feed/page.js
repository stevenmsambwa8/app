'use client'
import Link from 'next/link'
import PostCard from '../../components/PostCard'
import { usePosts } from '../../components/PostsProvider'
import { HEROES } from '../../lib/mockData'
import styles from './page.module.css'

export default function FeedPage() {
  const { posts, likes, toggleLike, loading, error, refreshPosts } = usePosts();

  return (
    <div className={styles.wrap}>
      <div className={styles.heroTrack}>
        {HEROES.map((h) => (
          <div
            key={h.id}
            className={styles.hero}
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 1.5px), ${h.gradient}`,
              backgroundSize: '16px 16px, 100% 100%',
            }}
          >
            <i className={`${h.icon} ${styles.heroIcon}`} />
            <span className={styles.heroEyebrow}>{h.eyebrow}</span>
            <h2 className={styles.heroTitle}>{h.title}</h2>
            <p className={styles.heroBody}>{h.body}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className={styles.stateBox}>
          <i className="ri-error-warning-line" />
          <p>Imeshindwa kupakia machapisho.</p>
          <p className={styles.stateDetail}>{error}</p>
          <button className="btnGhost" onClick={refreshPosts}>
            Jaribu Tena
          </button>
        </div>
      )}

      {!error && !loading && posts.length === 0 && (
        <div className={styles.stateBox}>
          <i className="ri-quill-pen-line" />
          <p>Hakuna machapisho bado.</p>
          <Link href="/create" className="btnAccent">
            Chapisha la Kwanza
          </Link>
        </div>
      )}

      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            liked={!!likes[post.id]}
            likeCount={post.likes + (likes[post.id] ? 1 : 0)}
            onLike={() => toggleLike(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
