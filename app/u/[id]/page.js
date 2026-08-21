'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import VibeTag from '../../../components/VibeTag'
import UserBadge from '../../../components/UserBadge'
import Avatar from '../../../components/Avatar'
import PostThumbGrid from '../../../components/PostThumbGrid'
import FollowBtn from '../../../components/FollowBtn'
import FollowListModal from '../../../components/FollowListModal'
import { useAuth } from '../../../components/AuthProvider'
import { useAuthModal } from '../../../components/AuthModalProvider'
import { usePosts } from '../../../components/PostsProvider'
import { useFollow } from '../../../components/FollowProvider'
import styles from '../../profile/page.module.css'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  // The route accepts either a profile UUID or a @mention username
  // (mentions in post text link to /u/<username>).
  const routeParam = params.id;

  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { posts } = usePosts();
  const { isFollowing, toggleFollow, pending, getCounts, countsCache } = useFollow();

  const [profileRow, setProfileRow] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [listModal, setListModal] = useState(null);
  const [tab, setTab] = useState('posts');

  // Once resolved, this is always the real profile id — everything below
  // (follows, post filtering, counts) keys off this, never the raw param.
  const uid = profileRow?.id || null;

  // If someone lands on their own profile via this route, send them to
  // /profile instead so they get the editable version.
  useEffect(() => {
    if (user && uid && uid === user.id) router.replace('/profile');
  }, [user, uid, router]);

  useEffect(() => {
    let cancelled = false;
    setProfileRow(null);
    setNotFound(false);
    const query = supabase
      .from('profiles')
      .select('id, username, avatar, avatar_url, bio, vibe, account_type, business_category, whatsapp');
    (UUID_RE.test(routeParam) ? query.eq('id', routeParam) : query.eq('username', routeParam))
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          return;
        }
        setProfileRow(data);
      });
    return () => {
      cancelled = true;
    };
  }, [routeParam]);

  useEffect(() => {
    if (!uid) return;
    // Show the cached count instantly (if we've fetched it before this
    // session) so the number doesn't flash to 0 while the fresh request
    // is still in flight, then update in the background once it resolves.
    if (countsCache[uid]) setCounts(countsCache[uid]);
    getCounts(uid).then(setCounts);
  }, [uid, getCounts]);

  if (notFound) {
    return (
      <div className={styles.body} style={{ textAlign: 'center', paddingTop: 48 }}>
        <p>Mtumiaji hakupatikana.</p>
      </div>
    );
  }

  if (!profileRow) return null;

  const displayName = profileRow.username || 'Mtumiaji';
  const displayHandle = `@${profileRow.username || 'mtumiaji'}`;
  const avatarEmoji = profileRow.avatar || '🐧';
  const avatarUrl = profileRow.avatar_url || null;
  const bioText = profileRow.bio || 'Bado hajaandika kuhusu yeye.';
  const vibeText = profileRow.vibe || 'Mwanachama Mpya';
  const isBusiness = profileRow.account_type === 'business';
  const businessCategory = profileRow.business_category;
  const whatsappNumber = profileRow.whatsapp;

  const theirPosts = posts.filter((p) => p.uid === uid);
  const following = isFollowing(uid);

  function handleFollowClick() {
    if (!user) {
      openAuth('signin');
      return;
    }
    toggleFollow(uid);
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (following ? -1 : 1)) }));
  }

  return (
    <div>
      <div className={styles.cover} />
      <div className={styles.body}>
        <div className={styles.headRow}>
          <div className={styles.avatarBigRing}>
            {avatarUrl ? (
              <div className={styles.avatarBig} style={{ padding: 0, overflow: 'hidden' }}>
                <Avatar src={avatarUrl} alt={displayName} size={80} />
              </div>
            ) : (
              <div className={styles.avatarBig}>{avatarEmoji}</div>
            )}
          </div>
          <div className={styles.headActions}>
            {isBusiness && whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Habari, nimeona wasifu wako Advat.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.messageBtn} ${styles.whatsappBtn}`}
                aria-label="Wasiliana kwa WhatsApp"
              >
                <i className="ri-whatsapp-fill" />
              </a>
            )}
            <button
              type="button"
              className={styles.messageBtn}
              onClick={() => (user ? router.push(`/dm?with=${uid}`) : openAuth('signin'))}
              aria-label="Tuma ujumbe"
            >
              <i className="ri-chat-3-line" />
            </button>
            <FollowBtn following={following} pending={!!pending[uid]} onClick={handleFollowClick} />
          </div>
        </div>

        <div className={styles.nameRow}>
          <span className={styles.name}>{displayName}</span>
          <UserBadge badge={isBusiness ? 'business' : null} />
        </div>

        <div className={styles.handleRow}>
          <span className={styles.handle}>{displayHandle}</span>
          <VibeTag vibe={isBusiness && businessCategory ? businessCategory : vibeText} />
        </div>
        <p className={styles.bio}>{bioText}</p>

        <div className={styles.statsRow}>
          <span><b>{theirPosts.length}</b> <span>machapisho</span></span>
          <button type="button" className={styles.statBtn} onClick={() => setListModal('followers')}>
            <b>{counts.followers}</b> <span>wafuasi</span>
          </button>
          <button type="button" className={styles.statBtn} onClick={() => setListModal('following')}>
            <b>{counts.following}</b> <span>anaowafuata</span>
          </button>
        </div>

        {isBusiness && (
          <div className={styles.tabs}>
            {[
              { key: 'posts', label: 'Machapisho' },
              { key: 'products', label: 'Bidhaa' },
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
        )}

        <div className={styles.posts} style={{ marginTop: isBusiness ? 0 : 20 }}>
          {(() => {
            const shown = isBusiness && tab === 'products'
              ? theirPosts.filter((p) => p.price != null)
              : theirPosts;
            if (shown.length === 0) {
              return (
                <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0' }}>
                  {isBusiness && tab === 'products'
                    ? 'Hakuna bidhaa yenye bei bado.'
                    : 'Bado hajachapisha chochote.'}
                </p>
              );
            }
            return <PostThumbGrid posts={shown} />;
          })()}
        </div>
      </div>

      {listModal && <FollowListModal uid={uid} mode={listModal} onClose={() => setListModal(null)} />}
    </div>
  );
}
