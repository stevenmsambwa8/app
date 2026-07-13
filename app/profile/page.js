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
          <div className={styles.avatarBigRing}>
            <div className={styles.avatarBig}>{ME.avatar}</div>
          </div>
          <button className={`btnGhost ${styles.editBtn}`}>Hariri Wasifu</button>
        </div>

        <div className={styles.nameRow}>
          <span className={styles.name}>{ME.name}</span>
          <UserBadge badge={ME.badge} />
        </div>
        <div className={styles.handleRow}>
          <span className={styles.handle}>{ME.handle}</span>
          <VibeTag vibe={ME.vibe} />
        </div>
        <p className={styles.bio}>Daima ninafuatilia mwanga mzuri na urafiki bora. Nitumie ujumbe wakati wowote.</p>

        <div className={styles.statsRow}>
          <span><b>214</b> <span>machapisho</span></span>
          <span><b>1.2k</b> <span>wafuasi</span></span>
          <span><b>318</b> <span>anaowafuata</span></span>
        </div>

        <div className={styles.tabs}>
          {[
            { key: 'posts', label: 'Machapisho' },
            { key: 'flex', label: 'Flex' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            >
              {t.label}
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
