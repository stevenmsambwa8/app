'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import PostCard from '../../components/PostCard'
import AdCard from '../../components/AdCard'
import { POSTS, ADS, ME } from '../../lib/mockData'
import styles from './page.module.css'

export default function FeedPage() {
  const [likes, setLikes] = useState({});

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.composer}`}>
        <Avatar emoji={ME.avatar} size={36} />
        <div className={styles.input}>Flex something today...</div>
      </div>

      {POSTS.map((post) =>
        post.kind === 'ad' ? (
          <AdCard key={post.id} ad={ADS[post.id % ADS.length]} />
        ) : (
          <PostCard
            key={post.id}
            post={post}
            liked={!!likes[post.id]}
            likeCount={post.likes + (likes[post.id] ? 1 : 0)}
            onLike={() => setLikes((l) => ({ ...l, [post.id]: !l[post.id] }))}
          />
        )
      )}
    </div>
  );
}
