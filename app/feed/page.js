'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import PostCard from '../../components/PostCard'
import AdCard from '../../components/AdCard'
import { POSTS, ADS, ME, USERS } from '../../lib/mockData'
import styles from './page.module.css'

export default function FeedPage() {
  const [likes, setLikes] = useState({});

  return (
    <div className={styles.wrap}>
      <div className={styles.stories}>
        {USERS.slice(0, 8).map((u) => (
          <div key={u.id} className={styles.story}>
            <Avatar emoji={u.avatar} size={52} ring />
            <span className={styles.storyName}>{u.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      <div className={`card ${styles.composer}`}>
        <Avatar emoji={ME.avatar} size={36} />
        <div className={styles.input}>Flex kitu leo...</div>
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
