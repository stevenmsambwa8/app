'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import VibeTag from '../../components/VibeTag'
import UserBadge from '../../components/UserBadge'
import FollowBtn from '../../components/FollowBtn'
import { USERS } from '../../lib/mockData'
import styles from './page.module.css'

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState({});

  const filtered = USERS.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.search}>
        <i className="ri-search-line" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find people..."
        />
      </div>

      <div className={styles.trending}>
        <i className="ri-line-chart-line" />
        <span className={styles.trendingText}>Popular in Nairobi &amp; Dar es Salaam</span>
      </div>

      <div className={styles.list}>
        {filtered.map((u) => (
          <div key={u.id} className={`card ${styles.row}`}>
            <Avatar emoji={u.avatar} size={44} />
            <div className={styles.who}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{u.name}</span>
                <UserBadge badge={u.badge} />
              </div>
              <div className={styles.metaRow}>
                <VibeTag vibe={u.vibe} />
                <span className={styles.meta}>{u.followers} followers</span>
              </div>
            </div>
            <FollowBtn
              following={!!following[u.id]}
              onClick={() => setFollowing((f) => ({ ...f, [u.id]: !f[u.id] }))}
            />
          </div>
        ))}
        {filtered.length === 0 && <p className={styles.empty}>No one found.</p>}
      </div>
    </div>
  );
}
