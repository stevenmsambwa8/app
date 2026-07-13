'use client'
import { useState } from 'react'
import VibeTag from '../../components/VibeTag'
import UserBadge from '../../components/UserBadge'
import { ME, POSTS, FLEX_CARDS } from '../../lib/mockData'
import styles from './page.module.css'

export default function ProfilePage() {
  const [tab, setTab] = useState('posts');
  const myPosts = POSTS.filter((p) => p.kind === 'post').slice(0, 3);

  return (
    <div>
      <div className={styles.cover} />
      <div className={styles.body}>
        <div className={styles.headRow}>
          <div className={styles.avatarBig}>{ME.avatar}</div>
          <button className={`btnGhost ${styles.editBtn}`}>Edit profile</button>
        </div>

        <div className={styles.nameRow}>
          <span className={styles.name}>{ME.name}</span>
          <UserBadge badge={ME.badge} />
        </div>
        <div className={styles.handleRow}>
          <span className={styles.handle}>{ME.handle}</span>
          <VibeTag vibe={ME.vibe} />
        </div>
        <p className={styles.bio}>Always chasing good light and better company. DM me anytime.</p>

        <div className={styles.statsRow}>
          <span><b>214</b> <span>posts</span></span>
          <span><b>1.2k</b> <span>followers</span></span>
          <span><b>318</b> <span>following</span></span>
        </div>

        <div className={styles.tabs}>
          {['posts', 'flex'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'posts' ? (
          <div className={styles.posts}>
            {myPosts.map((p) => (
              <div key={p.id} className={`card ${styles.postCard}`}>
                <p className={styles.postText}>{p.text}</p>
                <div className={styles.postMeta}>
                  <span><i className="ri-thumb-up-line" />{p.likes}</span>
                  <span><i className="ri-chat-3-line" />{p.comments}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.flexGrid}>
            {FLEX_CARDS.map((c) => (
              <div key={c.id} className={styles.flexCard} style={{ background: c.gradient }}>
                <i className={`${c.icon} ${styles.flexIcon}`} />
                <div className={styles.flexTitle}>{c.title}</div>
                <div className={styles.flexStat}>{c.stat}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
