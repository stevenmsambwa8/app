'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import Avatar from '../../components/Avatar'
import VibeTag from '../../components/VibeTag'
import PostThumbGrid from '../../components/PostThumbGrid'
import { useAuth } from '../../components/AuthProvider'
import { usePosts } from '../../components/PostsProvider'
import styles from './page.module.css'

const TABS = [
  { key: 'people', label: 'Watu' },
  { key: 'tags', label: 'Lebo' },
  { key: 'products', label: 'Bidhaa' },
];

const HASHTAG_RE = /#([a-zA-Z0-9_]{2,30})/g;

// The actual typing happens in TopBar's search bar (it's the single input
// for this whole feature, driving the ?q= param) — this page just renders
// results for whatever query is currently in the URL.
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const trimmed = query.trim();

  const [tab, setTab] = useState('people');
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const { user } = useAuth();
  const { posts } = usePosts();

  // People search hits the database directly (usernames aren't all loaded
  // client-side), debounced so we're not firing a query on every keystroke.
  useEffect(() => {
    if (trimmed.length < 2) {
      setPeople([]);
      setPeopleLoading(false);
      return;
    }
    let cancelled = false;
    setPeopleLoading(true);
    const timer = setTimeout(() => {
      let q = supabase
        .from('profiles')
        .select('id, username, avatar, avatar_url, vibe')
        .ilike('username', `%${trimmed}%`)
        .limit(20);
      if (user) q = q.neq('id', user.id);
      q.then(({ data, error }) => {
        if (cancelled) return;
        setPeople(error || !data ? [] : data);
        setPeopleLoading(false);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, user]);

  // Hashtags are counted from posts already loaded in this session (the
  // same feed data every other screen uses) rather than a separate fetch.
  const tagResults = useMemo(() => {
    const counts = {};
    const needle = trimmed.toLowerCase().replace(/^#/, '');
    posts.forEach((p) => {
      if (p.kind === 'ad' || !p.text) return;
      const seenInPost = new Set();
      for (const m of p.text.matchAll(HASHTAG_RE)) {
        const t = m[1].toLowerCase();
        if (seenInPost.has(t)) continue;
        seenInPost.add(t);
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .filter(([t]) => !needle || t.includes(needle))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [posts, trimmed]);

  // Products — same idea, filtered from already-loaded posts that have a price.
  const productResults = useMemo(() => {
    const needle = trimmed.toLowerCase();
    return posts.filter((p) => {
      if (p.kind === 'ad' || p.price == null) return false;
      if (!needle) return true;
      return `${p.text || ''} ${p.tag || ''}`.toLowerCase().includes(needle);
    });
  }, [posts, trimmed]);

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'people' && (
        <div className={styles.list}>
          {trimmed.length < 2 ? (
            <p className={styles.empty}>Andika angalau herufi 2 kutafuta watu.</p>
          ) : peopleLoading ? (
            <p className={styles.empty}>Inatafuta…</p>
          ) : people.length === 0 ? (
            <p className={styles.empty}>Hakuna aliyepatikana kwa &ldquo;{trimmed}&rdquo;.</p>
          ) : (
            people.map((p) => (
              <Link key={p.id} href={`/u/${p.id}`} className={`card ${styles.row}`}>
                <Avatar emoji={p.avatar} src={p.avatar_url} size={44} ring />
                <div className={styles.who}>
                  <span className={styles.name}>{p.username || 'Mtumiaji'}</span>
                  <VibeTag vibe={p.vibe || 'Mwanachama Mpya'} />
                </div>
                <i className="ri-arrow-right-s-line" />
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'tags' && (
        <div className={styles.list}>
          {tagResults.length === 0 ? (
            <p className={styles.empty}>
              {trimmed ? `Hakuna lebo inayolingana na "${trimmed}".` : 'Hakuna lebo bado.'}
            </p>
          ) : (
            tagResults.map(([t, count]) => (
              <Link key={t} href={`/tag/${t}`} className={`card ${styles.row}`}>
                <span className={styles.tagIcon}>
                  <i className="ri-hashtag" />
                </span>
                <div className={styles.who}>
                  <span className={styles.name}>#{t}</span>
                  <span className={styles.meta}>
                    {count} {count === 1 ? 'chapisho' : 'machapisho'}
                  </span>
                </div>
                <i className="ri-arrow-right-s-line" />
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className={styles.productsWrap}>
          {productResults.length === 0 ? (
            <p className={styles.empty}>
              {trimmed ? `Hakuna bidhaa inayolingana na "${trimmed}".` : 'Hakuna bidhaa bado.'}
            </p>
          ) : (
            <PostThumbGrid posts={productResults} />
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.wrap} />}>
      <SearchResults />
    </Suspense>
  );
}
