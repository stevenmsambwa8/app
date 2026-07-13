'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import RankBadge from '../../components/RankBadge'
import FollowBtn from '../../components/FollowBtn'
import { USERS } from '../../lib/mockData'
import styles from './page.module.css'

export default function PlayersPage() {
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
          placeholder="Find players..."
        />
      </div>

      <div className={styles.trending}>
        <i className="ri-line-chart-line" />
        <span className={styles.trendingText}>Trending in Nairobi &amp; Dar es Salaam</span>
      </div>

      <div className={styles.list}>
        {filtered.map((u) => (
          <div key={u.id} className={`card ${styles.row}`}>
            <Avatar emoji={u.avatar} size={44} />
            <div className={styles.who}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{u.name}</span>
                <RankBadge rank={u.rank} />
              </div>
              <span className={styles.meta}>{u.game} · {u.followers} followers</span>
            </div>
            <FollowBtn
              following={!!following[u.id]}
              onClick={() => setFollowing((f) => ({ ...f, [u.id]: !f[u.id] }))}
            />
          </div>
        ))}
        {filtered.length === 0 && <p className={styles.empty}>No players found.</p>}
      </div>
    </div>
  );
}
