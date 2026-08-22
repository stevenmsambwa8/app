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
  const [countsReady, setCountsReady] = useState(false);
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
      .select(
        'id, username, avatar, avatar_url, bio, vibe, account_type, business_category, whatsapp, ' +
        'business_name, business_description, business_email, business_address, business_website, business_hours, business_phone, mention_username'
      );
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
    // Only the very first, never-cached load shows a skeleton.
    if (countsCache[uid]) {
      setCounts(countsCache[uid]);
      setCountsReady(true);
    }
    getCounts(uid).then((c) => {
      setCounts(c);
      setCountsReady(true);
    });
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
  const businessName = profileRow.business_name;
  const businessDescription = profileRow.business_description;
  const businessEmail = profileRow.business_email;
  const businessAddress = profileRow.business_address;
  const businessWebsite = profileRow.business_website;
  const businessHours = profileRow.business_hours;
  const businessPhone = profileRow.business_phone;
  const mentionUsername = profileRow.mention_username;

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
      <div className={styles.body}>
        <div className={styles.headerCenter}>
          <div className={styles.avatarWrap}>
            {avatarUrl ? (
              <div className={styles.avatarBig} style={{ padding: 0, overflow: 'hidden' }}>
                <Avatar src={avatarUrl} alt={displayName} size={90} />
              </div>
            ) : (
              <div className={styles.avatarBig}>{avatarEmoji}</div>
            )}
          </div>

          <div className={styles.nameRow}>
            <span className={styles.name}>{displayName}</span>
            <UserBadge badge={isBusiness ? 'business' : null} />
          </div>

          <div className={styles.handleRow}>
            <span className={styles.handle}>{displayHandle}</span>
            {!isBusiness && <VibeTag vibe={vibeText} />}
          </div>

          {isBusiness && businessCategory && (
            <span className={styles.categoryChip}>
              <i className="ri-store-2-fill" />
              {businessCategory}
            </span>
          )}

          <div className={styles.statsRow}>
            <span className={styles.statCell}>
              <b>{theirPosts.length}</b>
              <span>machapisho</span>
            </span>
            <div className={styles.statDivider} />
            <button type="button" className={styles.statCell} onClick={() => setListModal('followers')}>
              {countsReady ? <b>{counts.followers}</b> : <span className={styles.skelStat} aria-hidden="true" />}
              <span>wafuasi</span>
            </button>
            <div className={styles.statDivider} />
            <button type="button" className={styles.statCell} onClick={() => setListModal('following')}>
              {countsReady ? <b>{counts.following}</b> : <span className={styles.skelStat} aria-hidden="true" />}
              <span>anaowafuata</span>
            </button>
          </div>

          <div className={styles.actionsRow}>
            <div className={styles.followActionBtn}>
              <FollowBtn following={following} pending={!!pending[uid]} onClick={handleFollowClick} />
            </div>
            <button
              type="button"
              className={styles.messageActionBtn}
              onClick={() => (user ? router.push(`/dm?with=${uid}`) : openAuth('signin'))}
              aria-label="Tuma ujumbe"
            >
              <i className="ri-chat-3-line" />
            </button>
            {isBusiness && whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Habari, nimeona wasifu wako Advat.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappActionBtn}
                aria-label="Wasiliana kwa WhatsApp"
              >
                <i className="ri-whatsapp-fill" />
                WhatsApp
              </a>
            )}
          </div>

          <p className={styles.bio}>{bioText}</p>

          {isBusiness && (businessName || businessDescription || businessEmail || businessAddress || businessWebsite || businessHours || businessPhone || mentionUsername) && (
            <div className={styles.businessInfoCard}>
              {businessName && <p className={styles.businessInfoName}>{businessName}</p>}
              {businessDescription && <p className={styles.businessInfoRow}>{businessDescription}</p>}
              {businessAddress && (
                <p className={styles.businessInfoRow}><i className="ri-map-pin-2-line" /> {businessAddress}</p>
              )}
              {businessHours && (
                <p className={styles.businessInfoRow}><i className="ri-time-line" /> {businessHours}</p>
              )}
              {businessPhone && (
                <a className={styles.businessInfoRow} href={`tel:+${businessPhone}`}>
                  <i className="ri-phone-line" /> +{businessPhone}
                </a>
              )}
              {businessEmail && (
                <p className={styles.businessInfoRow}><i className="ri-mail-line" /> {businessEmail}</p>
              )}
              {businessWebsite && (
                <a
                  className={styles.businessInfoRow}
                  href={/^https?:\/\//.test(businessWebsite) ? businessWebsite : `https://${businessWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="ri-global-line" /> {businessWebsite}
                </a>
              )}
              {mentionUsername && (
                <p className={styles.businessInfoRow}>
                  <i className="ri-user-star-line" /> Wasiliana na{' '}
                  <a href={`/u/${mentionUsername}`} className="rich-mention">@{mentionUsername}</a>
                </p>
              )}
            </div>
          )}
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
                <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0', maxWidth: 'none' }}>
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
