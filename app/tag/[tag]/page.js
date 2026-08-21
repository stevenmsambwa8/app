'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PostCard from '../../../components/PostCard'
import { usePosts } from '../../../components/PostsProvider'
import styles from './page.module.css'

// Matches the same hashtag shape lib/richText.js links out to, so a tag
// only counts as "used" in a post when it's a real standalone #hashtag
// token, not just the substring appearing mid-word somewhere in the text.
function postHasTag(text, tag) {
  if (!text) return false;
  const re = new RegExp(`#${tag}\\b`, 'i');
  return re.test(text);
}

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = decodeURIComponent(params.tag || '');
  const { posts, likes, toggleLike, loading, error } = usePosts();

  const tagged = useMemo(
    () => posts.filter((p) => p.kind !== 'ad' && postHasTag(p.text, tag)),
    [posts, tag]
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <div className={styles.headText}>
          <span className={styles.tagName}>#{tag}</span>
          <span className={styles.tagCount}>
            {tagged.length} {tagged.length === 1 ? 'chapisho' : 'machapisho'}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.stateBox}>
          <i className="ri-error-warning-line" />
          <p>Imeshindwa kupakia machapisho.</p>
        </div>
      )}

      {!error && !loading && tagged.length === 0 && (
        <div className={styles.stateBox}>
          <i className="ri-hashtag" />
          <p>Hakuna chapisho lenye #{tag} bado.</p>
          <Link href="/create" className="btnAccent">
            Chapisha la Kwanza
          </Link>
        </div>
      )}

      <div className={styles.postsGrid}>
        {tagged.map((post) => (
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
