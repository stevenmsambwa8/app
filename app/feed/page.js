'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import PostCard from '../../components/PostCard'
import AdCard from '../../components/AdCard'
import { POSTS, ADS, ME, HEROES } from '../../lib/mockData'
import styles from './page.module.css'

export default function FeedPage() {
  const [likes, setLikes] = useState({});

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

      <div className={`card ${styles.composer}`}>
        <Avatar emoji={ME.avatar} size={36} />
        <div className={styles.input}>Flex kitu leo...</div>
      </div>

      <div className={styles.postsGrid}>
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
    </div>
  );
}
