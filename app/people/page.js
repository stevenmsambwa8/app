'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Avatar from '../../components/Avatar'
import VibeTag from '../../components/VibeTag'
import FollowBtn from '../../components/FollowBtn'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { useFollow } from '../../components/FollowProvider'
import { VIBES } from '../../lib/mockData'
import styles from './page.module.css'

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [vibe, setVibe] = useState(null);
  const [people, setPeople] = useState([]);
  const [followerCounts, setFollowerCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { isFollowing, toggleFollow, pending } = useFollow();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, username, avatar, avatar_url, vibe')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled || error) {
          setLoading(false);
          return;
        }
        const rows = (data || []).filter((p) => p.id !== user?.id);
        setPeople(rows);
        setLoading(false);

        if (rows.length) {
          supabase
            .from('follows')
            .select('following_id')
            .in('following_id', rows.map((p) => p.id))
            .then(({ data: followRows }) => {
              if (cancelled || !followRows) return;
              const counts = {};
              followRows.forEach((r) => {
                counts[r.following_id] = (counts[r.following_id] || 0) + 1;
              });
              setFollowerCounts(counts);
            });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handleFollowClick(uid) {
    if (!user) {
      openAuth('signin');
      return;
    }
    toggleFollow(uid);
    setFollowerCounts((c) => ({
      ...c,
      [uid]: Math.max(0, (c[uid] || 0) + (isFollowing(uid) ? -1 : 1)),
    }));
  }

  const filtered = people.filter(
    (u) =>
      (u.username || '').toLowerCase().includes(query.toLowerCase()) &&
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
        {loading ? (
          <p className={styles.empty}>Inapakia…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Hakuna aliyepatikana.</p>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className={`card ${styles.row}`}>
              <Link href={`/u/${u.id}`} className={styles.linkRow}>
                <Avatar emoji={u.avatar} src={u.avatar_url} size={44} ring />
                <div className={styles.who}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{u.username || 'Mtumiaji'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <VibeTag vibe={u.vibe || 'Mwanachama Mpya'} />
                    <span className={styles.meta}>wafuasi {followerCounts[u.id] || 0}</span>
                  </div>
                </div>
              </Link>
              <FollowBtn
                following={isFollowing(u.id)}
                pending={!!pending[u.id]}
                onClick={() => handleFollowClick(u.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
