'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import VibeTag from '../../components/VibeTag'
import UserBadge from '../../components/UserBadge'
import Avatar from '../../components/Avatar'
import PostThumbGrid from '../../components/PostThumbGrid'
import BusinessStats from '../../components/BusinessStats'
import FollowListModal from '../../components/FollowListModal'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { usePosts } from '../../components/PostsProvider'
import { useFollow } from '../../components/FollowProvider'
import { ME } from '../../lib/mockData'
import styles from './page.module.css'

// Consecutive-day posting streak, counted the way most habit trackers do:
// if there's already a post today it counts, otherwise the streak is still
// "alive" through the end of today as long as there was one yesterday.
function computeStreakDays(posts) {
  const dateKeys = new Set(
    posts
      .filter((p) => p.createdAt)
      .map((p) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );
  if (dateKeys.size === 0) return 0;

  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!dateKeys.has(keyOf(cursor))) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  let streak = 0;
  while (dateKeys.has(keyOf(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

function computeFlexCards(posts, likes) {
  const totalLikes = posts.reduce((sum, p) => sum + p.likes + (likes[p.id] ? 1 : 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const bestPost = posts.reduce((best, p) => {
    const total = p.likes + (likes[p.id] ? 1 : 0);
    return total > (best?.total || 0) ? { post: p, total } : best;
  }, null);
  const streak = computeStreakDays(posts);

  return [
    {
      id: 'streak',
      title: 'Mfululizo wa Kuchapisha',
      stat: streak > 0 ? `siku ${streak}` : 'Anza leo',
      icon: 'ri-fire-fill',
      gradient: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
    },
    {
      id: 'likes',
      title: 'Mapendo Yote',
      stat: totalLikes > 0 ? `mapendo ${totalLikes.toLocaleString('sw-TZ')}` : 'Bado hakuna',
      icon: 'ri-heart-fill',
      gradient: 'linear-gradient(135deg, var(--accent-lime), var(--accent-teal))',
    },
    {
      id: 'comments',
      title: 'Maoni Yote',
      stat: totalComments > 0 ? `maoni ${totalComments.toLocaleString('sw-TZ')}` : 'Bado hakuna',
      icon: 'ri-chat-3-fill',
      gradient: 'linear-gradient(135deg, var(--accent-amber), var(--accent))',
    },
    {
      id: 'best',
      title: 'Chapisho Bora',
      stat: bestPost ? `mapendo ${bestPost.total.toLocaleString('sw-TZ')}` : 'Chapisha la kwanza',
      icon: 'ri-trophy-fill',
      gradient: 'linear-gradient(135deg, var(--accent-2), var(--accent-teal))',
    },
  ];
}

export default function ProfilePage() {
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState('');
  const [listModal, setListModal] = useState(null); // 'followers' | 'following' | null
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [countsReady, setCountsReady] = useState(false);
  const fileInputRef = useRef(null);

  const { user, profile, loading, updateUsername, uploadAvatar } = useAuth();
  const { openAuth } = useAuthModal();
  const { posts, likes } = usePosts();
  const { getCounts, countsCache } = useFollow();
  const myPosts = posts.filter((p) => p.uid === user?.id);
  const flexCards = computeFlexCards(myPosts, likes);

  useEffect(() => {
    if (!user) return;
    // Show the cached count instantly if we already have it from this
    // session, then refresh quietly in the background — avoids the
    // "0 -> real number" flash every time this page is opened. Only the
    // very first, never-cached load shows a skeleton instead of a number.
    if (countsCache[user.id]) {
      setCounts(countsCache[user.id]);
      setCountsReady(true);
    }
    getCounts(user.id).then((c) => {
      setCounts(c);
      setCountsReady(true);
    });
  }, [user, getCounts]);

  if (loading) return null;

  if (!user) {
    return (
      <div className={styles.body} style={{ textAlign: 'center', paddingTop: 48 }}>
        <p style={{ marginBottom: 16 }}>Ingia ili kuona na kuhariri wasifu wako.</p>
        <button className="btnAccent" onClick={() => openAuth('signin')}>
          Ingia / Jisajili
        </button>
      </div>
    );
  }

  const displayName = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || ME.name;
  const displayHandle = `@${displayName}`;
  const avatarEmoji = profile?.avatar || ME.avatar;
  const avatarUrl = profile?.avatar_url || null;
  const bioText = profile?.bio || 'Daima ninafuatilia mwanga mzuri na urafiki bora. Nitumie ujumbe wakati wowote.';
  const vibeText = profile?.vibe || ME.vibe;
  const isBusiness = profile?.account_type === 'business';
  const businessCategory = profile?.business_category;
  const whatsappNumber = profile?.whatsapp;

  function startEditing() {
    setNameInput(displayName);
    setFormError('');
    setEditing(true);
  }

  async function handleSaveName() {
    setFormError('');
    if (nameInput.trim() === displayName) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    const { error } = await updateUsername(nameInput);
    setSavingName(false);
    if (error) {
      setFormError(error.message || 'Imeshindwa kuhifadhi jina.');
      return;
    }
    setEditing(false);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Chagua faili ya picha.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Picha kubwa mno (kikomo 5MB).');
      return;
    }
    setFormError('');
    setUploadingAvatar(true);
    const { error } = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (error) setFormError(error.message || 'Imeshindwa kupakia picha.');
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
            <button
              type="button"
              className={styles.avatarEditBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Badilisha picha ya wasifu"
            >
              <i className={uploadingAvatar ? 'ri-loader-4-line' : 'ri-camera-line'} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
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
          {isBusiness && !businessCategory && (
            <Link href="/business" className={styles.categoryChip}>
              <i className="ri-store-2-fill" />
              Weka aina ya biashara
            </Link>
          )}

          <div className={styles.statsRow}>
            <span className={styles.statCell}>
              <b>{myPosts.length}</b>
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
            {editing ? (
              <div className={styles.editActions}>
                <button className="btnGhost" onClick={() => setEditing(false)} disabled={savingName}>
                  Ghairi
                </button>
                <button className="btnAccent" onClick={handleSaveName} disabled={savingName}>
                  {savingName ? 'Inahifadhi…' : 'Hifadhi'}
                </button>
              </div>
            ) : (
              <>
                <button className={styles.editBtnWide} onClick={startEditing}>
                  Hariri Wasifu
                </button>
                {isBusiness && whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Habari, nimeona wasifu wangu Advat.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappActionBtn}
                  >
                    <i className="ri-whatsapp-fill" />
                    WhatsApp
                  </a>
                )}
              </>
            )}
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          {!editing && <p className={styles.bio}>{bioText}</p>}

          {editing && (
            <div className={styles.editPanel}>
              <input
                className={styles.nameInput}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                placeholder="Jina lako"
              />

              {isBusiness ? (
                <Link href="/business" className={styles.businessManageLink}>
                  <i className="ri-store-2-fill" />
                  Simamia Akaunti ya Biashara
                  <i className="ri-arrow-right-s-line" />
                </Link>
              ) : (
                <Link href="/business" className={styles.businessUpsell}>
                  <i className="ri-store-2-fill" />
                  Badilisha kuwa Akaunti ya Biashara
                </Link>
              )}
            </div>
          )}
        </div>

        <div className={styles.tabs}>
          {(isBusiness
            ? [
                { key: 'posts', label: 'Machapisho' },
                { key: 'products', label: 'Bidhaa' },
                { key: 'stats', label: 'Takwimu' },
              ]
            : [
                { key: 'posts', label: 'Machapisho' },
                { key: 'flex', label: 'Flex' },
              ]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'posts' ? (
          <div className={styles.posts}>
            {myPosts.length === 0 ? (
              <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0', maxWidth: 'none' }}>
                Hujachapisha bado.
              </p>
            ) : (
              <PostThumbGrid posts={myPosts} />
            )}
          </div>
        ) : tab === 'products' ? (
          <div className={styles.posts}>
            {myPosts.filter((p) => p.price != null).length === 0 ? (
              <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0', maxWidth: 'none' }}>
                Hujaweka bidhaa yenye bei bado. Weka bei wakati wa kuchapisha ili ionekane hapa.
              </p>
            ) : (
              <PostThumbGrid posts={myPosts.filter((p) => p.price != null)} />
            )}
          </div>
        ) : tab === 'stats' ? (
          <BusinessStats posts={myPosts} />
        ) : (
          <div className={styles.flexGrid}>
            {flexCards.map((c) => (
              <div key={c.id} className={styles.flexCard} style={{ background: c.gradient }}>
                <i className={`${c.icon} ${styles.flexIcon}`} />
                <div className={styles.flexTitle}>{c.title}</div>
                <div className={styles.flexStat}>{c.stat}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {listModal && (
        <FollowListModal
          uid={user.id}
          mode={listModal}
          onClose={() => setListModal(null)}
        />
      )}
    </div>
  );
}
