'use client'
import Link from 'next/link'
import PostCard from '../../components/PostCard'
import { usePosts } from '../../components/PostsProvider'
import styles from './page.module.css'

export default function FeedPage() {
  const { posts, likes, toggleLike, loading, error, refreshPosts } = usePosts();

  return (
    <div className={styles.wrap}>
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
