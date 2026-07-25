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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.id;

  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { posts } = usePosts();
  const { isFollowing, toggleFollow, pending, getCounts } = useFollow();

  const [profileRow, setProfileRow] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [listModal, setListModal] = useState(null);

  // If someone lands on their own uid via this route, send them to /profile
  // instead so they get the editable version.
  useEffect(() => {
    if (user && uid === user.id) router.replace('/profile');
  }, [user, uid, router]);

  useEffect(() => {
    let cancelled = false;
    setProfileRow(null);
    setNotFound(false);
    supabase
      .from('profiles')
      .select('id, username, avatar, avatar_url, bio, vibe, account_type, business_category, whatsapp')
      .eq('id', uid)
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
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
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

        <div className={styles.posts} style={{ marginTop: 20 }}>
          {theirPosts.length === 0 ? (
            <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0' }}>
              Bado hajachapisha chochote.
            </p>
          ) : (
            <PostThumbGrid posts={theirPosts} />
          )}
        </div>
      </div>

      {listModal && <FollowListModal uid={uid} mode={listModal} onClose={() => setListModal(null)} />}
    </div>
  );
}
