'use client'
import { useRef, useState } from 'react'
import VibeTag from '../../components/VibeTag'
import UserBadge from '../../components/UserBadge'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { usePosts } from '../../components/PostsProvider'
import { ME, FLEX_CARDS } from '../../lib/mockData'
import styles from './page.module.css'

export default function ProfilePage() {
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const { user, profile, loading, updateUsername, uploadAvatar } = useAuth();
  const { openAuth } = useAuthModal();
  const { posts } = usePosts();
  const myPosts = posts.filter((p) => p.uid === user?.id);

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
      <div className={styles.cover} />
      <div className={styles.body}>
        <div className={styles.headRow}>
          <div className={styles.avatarBigRing} style={{ position: 'relative' }}>
            {avatarUrl ? (
              <div className={styles.avatarBig} style={{ padding: 0, overflow: 'hidden' }}>
                <Avatar src={avatarUrl} alt={displayName} size={80} />
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
            <button className={`btnGhost ${styles.editBtn}`} onClick={startEditing}>
              Hariri Wasifu
            </button>
          )}
        </div>

        {editing ? (
          <div className={styles.nameEditRow}>
            <input
              className={styles.nameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              placeholder="Jina lako"
            />
          </div>
        ) : (
          <div className={styles.nameRow}>
            <span className={styles.name}>{displayName}</span>
            <UserBadge badge={ME.badge} />
          </div>
        )}

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.handleRow}>
          <span className={styles.handle}>{displayHandle}</span>
          <VibeTag vibe={vibeText} />
        </div>
        <p className={styles.bio}>{bioText}</p>

        <div className={styles.statsRow}>
          <span><b>{myPosts.length}</b> <span>machapisho</span></span>
          <span><b>1.2k</b> <span>wafuasi</span></span>
          <span><b>318</b> <span>anaowafuata</span></span>
        </div>

        <div className={styles.tabs}>
          {[
            { key: 'posts', label: 'Machapisho' },
            { key: 'flex', label: 'Flex' },
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

        {tab === 'posts' ? (
          <div className={styles.posts}>
            {myPosts.length === 0 ? (
              <p className={styles.bio} style={{ textAlign: 'center', padding: '24px 0' }}>
                Hujachapisha bado.
              </p>
            ) : (
              myPosts.map((p) => (
                <div key={p.id} className={`card ${styles.postCard}`}>
                  <p className={styles.postText}>{p.text}</p>
                  <div className={styles.postMeta}>
                    <span><i className="ri-thumb-up-line" />{p.likes}</span>
                    <span><i className="ri-chat-3-line" />{p.comments}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.flexGrid}>
            {FLEX_CARDS.map((c) => (
              <div key={c.id} className={styles.flexCard} style={{ background: c.gradient }}>
                <i className={`${c.icon} ${styles.flexIcon}`} />
                <div className={styles.flexTitle}>{c.title}</div>
                <div className={styles.flexStat}>{c.stat}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
