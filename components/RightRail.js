'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import Avatar from './Avatar'
import FollowBtn from './FollowBtn'
import { useAuth } from './AuthProvider'
import { useAuthModal } from './AuthModalProvider'
import { useFollow } from './FollowProvider'
import { VIBES } from '../lib/mockData'
import styles from './RightRail.module.css'

export default function RightRail() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { isFollowing, toggleFollow, pending, followingIds } = useFollow();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, username, avatar, avatar_url')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const rows = data.filter((p) => p.id !== user?.id && !followingIds.has(p.id)).slice(0, 4);
        setSuggestions(rows);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleFollowClick(uid) {
    if (!user) {
      openAuth('signin');
      return;
    }
    toggleFollow(uid);
    setSuggestions((list) => list.filter((p) => p.id !== uid));
  }

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

      {suggestions.length > 0 && (
        <div className={`card ${styles.panel}`}>
          <h3 className={styles.heading}>Wa Kufuata</h3>
          <div className={styles.suggestList}>
            {suggestions.map((u) => (
              <div key={u.id} className={styles.suggestRow}>
                <Link href={`/u/${u.id}`} className={styles.suggestWhoLink}>
                  <Avatar emoji={u.avatar} src={u.avatar_url} size={38} ring />
                  <div className={styles.suggestWho}>
                    <div className={styles.suggestNameRow}>
                      <span className={styles.suggestName}>{u.username || 'Mtumiaji'}</span>
                    </div>
                    <span className={styles.suggestHandle}>@{u.username || 'mtumiaji'}</span>
                  </div>
                </Link>
                <FollowBtn
                  following={isFollowing(u.id)}
                  pending={!!pending[u.id]}
                  small
                  onClick={() => handleFollowClick(u.id)}
                />
              </div>
            ))}
          </div>
          <Link href="/people" className={styles.showMore}>
            Onyesha zaidi
          </Link>
        </div>
      )}

      <p className={styles.footNote}>Advat &middot; Shiriki Matukio Yako</p>
    </aside>
  );
}
