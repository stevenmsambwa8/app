'use client'
import { useState } from 'react'
import Link from 'next/link'
import Avatar from './Avatar'
import UserBadge from './UserBadge'
import FollowBtn from './FollowBtn'
import { VIBES, LEADERBOARD } from '../lib/mockData'
import styles from './RightRail.module.css'

export default function RightRail() {
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState({});
  const suggestions = LEADERBOARD.slice(0, 4);

  return (
    <aside className={styles.rail}>
      <div className={styles.search}>
        <i className="ri-search-line" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tafuta kwenye Advat..."
        />
      </div>

      <div className={`card ${styles.panel}`}>
        <h3 className={styles.heading}>Vinavyovuma</h3>
        <div className={styles.trendList}>
          {VIBES.slice(0, 5).map((v, i) => (
            <Link key={v} href="/people" className={styles.trendRow}>
              <span className={styles.trendRank}>{i + 1}</span>
              <div className={styles.trendText}>
                <span className={styles.trendVibe}>{v}</span>
                <span className={styles.trendCount}>{(3.2 - i * 0.4).toFixed(1)}k machapisho</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={`card ${styles.panel}`}>
        <h3 className={styles.heading}>Wa Kufuata</h3>
        <div className={styles.suggestList}>
          {suggestions.map((u) => (
            <div key={u.id} className={styles.suggestRow}>
              <Avatar emoji={u.avatar} size={38} ring />
              <div className={styles.suggestWho}>
                <div className={styles.suggestNameRow}>
                  <span className={styles.suggestName}>{u.name}</span>
                  <UserBadge badge={u.badge} />
                </div>
                <span className={styles.suggestHandle}>{u.handle}</span>
              </div>
              <FollowBtn
                following={!!following[u.id]}
                onClick={() => setFollowing((f) => ({ ...f, [u.id]: !f[u.id] }))}
              />
            </div>
          ))}
        </div>
        <Link href="/people" className={styles.showMore}>
          Onyesha zaidi
        </Link>
      </div>

      <p className={styles.footNote}>Advat &middot; Shiriki Matukio Yako</p>
    </aside>
  );
}
