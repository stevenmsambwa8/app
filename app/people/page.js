'use client'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import VibeTag from '../../components/VibeTag'
import UserBadge from '../../components/UserBadge'
import FollowBtn from '../../components/FollowBtn'
import { USERS, VIBES } from '../../lib/mockData'
import styles from './page.module.css'

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState(null);
  const [following, setFollowing] = useState({});

  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) &&
      (!vibe || u.vibe === vibe)
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.search}>
        <i className="ri-search-line" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tafuta watu..."
        />
      </div>

      <div className={styles.trending}>
        <i className="ri-line-chart-line" />
        <span className={styles.trendingText}>Maarufu Nairobi na Dar es Salaam</span>
      </div>

      <div className={styles.chips}>
        <button
          className={`${styles.chip} ${!vibe ? styles.chipActive : ''}`}
          onClick={() => setVibe(null)}
        >
          Wote
        </button>
        {VIBES.map((v) => (
          <button
            key={v}
            className={`${styles.chip} ${vibe === v ? styles.chipActive : ''}`}
            onClick={() => setVibe(v === vibe ? null : v)}
          >
            {v}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.map((u) => (
          <div key={u.id} className={`card ${styles.row}`}>
            <Avatar emoji={u.avatar} size={44} ring />
            <div className={styles.who}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{u.name}</span>
                <UserBadge badge={u.badge} />
              </div>
              <div className={styles.metaRow}>
                <VibeTag vibe={u.vibe} />
                <span className={styles.meta}>wafuasi {u.followers}</span>
              </div>
            </div>
            <FollowBtn
              following={!!following[u.id]}
              onClick={() => setFollowing((f) => ({ ...f, [u.id]: !f[u.id] }))}
            />
          </div>
        ))}
        {filtered.length === 0 && <p className={styles.empty}>Hakuna aliyepatikana.</p>}
      </div>
    </div>
  );
}
