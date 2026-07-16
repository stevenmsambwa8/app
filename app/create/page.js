'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '../../components/Avatar'
import { usePosts } from '../../components/PostsProvider'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { ME, VIBES, IMAGE_PRESETS, CTA_ICON_PRESETS } from '../../lib/mockData'
import styles from './page.module.css'

const MAX_IMAGES = 5;

// Adds https:// to bare domains like "shop.com" so the CTA always produces
// a valid, clickable link rather than a relative/broken href.
function normalizeUrl(raw) {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { addPost, uploadPostImage } = usePosts();
  const { user, profile, loading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();

  const [text, setText] = useState('');
  const [tag, setTag] = useState(VIBES[0]);
  const [presetImages, setPresetImages] = useState([]);
  const [photos, setPhotos] = useState([]); // [{ localId, url, uploading, error }]
  const [ctaOn, setCtaOn] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaIcon, setCtaIcon] = useState(CTA_ICON_PRESETS[0].icon);
  const [ctaUrl, setCtaUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  const usedSlots = photos.length + presetImages.length;

  if (authLoading) return null;

  if (!user) {
    return (
      <div className={styles.wrap} style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ marginBottom: 16 }}>Ingia ili kuunda chapisho.</p>
        <button className="btnAccent" onClick={() => openAuth('signin')}>
          Ingia / Jisajili
        </button>
      </div>
    );
  }

  function toggleImage(preset) {
    // Templates are single-select — picking one replaces whatever
    // was picked before (clicking the current pick clears it).
    setPresetImages((imgs) => (imgs[0] === preset ? [] : [preset]));
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const room = MAX_IMAGES - usedSlots;
    const toUpload = files.slice(0, Math.max(0, room));

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue;
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPhotos((p) => [...p, { localId, url: null, uploading: true, error: '' }]);

      const { url, error } = await uploadPostImage(file);

      setPhotos((p) =>
        p.map((ph) =>
          ph.localId === localId
            ? { ...ph, uploading: false, url: url || null, error: error ? error.message : '' }
            : ph
        )
      );
    }
  }

  function removePhoto(localId) {
    setPhotos((p) => p.filter((ph) => ph.localId !== localId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    const stillUploading = photos.some((p) => p.uploading);
    if (stillUploading) {
      setSubmitError('Subiri picha zimalize kupakia.');
      return;
    }

    setSubmitError('');
    setPosting(true);

    const uploadedUrls = photos.filter((p) => p.url).map((p) => p.url);
    const finalImages = uploadedUrls.length ? uploadedUrls : presetImages;

    const { error } = await addPost({
      text: text.trim(),
      tag,
      images: finalImages.length ? finalImages : undefined,
      cta:
        ctaOn && ctaLabel.trim()
          ? { label: ctaLabel.trim(), icon: ctaIcon, url: normalizeUrl(ctaUrl) }
          : undefined,
    });

    setPosting(false);

    if (error) {
      setSubmitError(error.message || 'Imeshindwa kuchapisha. Jaribu tena.');
      return;
    }
    router.push('/feed');
  }

  const displayName = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || ME.name;

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <h1 className={styles.title}>Unda Chapisho</h1>
        <div style={{ width: 36 }} />
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.who}>
          <Avatar emoji={profile?.avatar || ME.avatar} src={profile?.avatar_url} size={40} ring />
          <div>
            <div className={styles.name}>{displayName}</div>
            <div className={styles.handle}>@{displayName}</div>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Flex kitu leo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
        />

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Kategoria</p>
          <div className={styles.tagRow}>
            {VIBES.map((v) => (
              <button
                type="button"
                key={v}
                className={`${styles.tagChip} ${tag === v ? styles.tagChipActive : ''}`}
                onClick={() => setTag(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            Picha ({usedSlots}/{MAX_IMAGES}) <span className={styles.hint}>zimebanwa kiotomatiki hadi 20KB kila moja</span>
          </p>
          <div className={styles.imageGrid}>
            {photos.map((p) => (
              <div key={p.localId} className={styles.imageSwatch}>
                {p.uploading ? (
                  <div className={styles.photoStatus}>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : p.error ? (
                  <div className={styles.photoStatus}>
                    <i className="ri-error-warning-line" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="" className={styles.photoThumb} />
                )}
                <button
                  type="button"
                  className={styles.photoRemove}
                  onClick={() => removePhoto(p.localId)}
                  aria-label="Ondoa picha"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            ))}

            {usedSlots < MAX_IMAGES && presetImages.length === 0 && (
              <button
                type="button"
                className={`${styles.imageSwatch} ${styles.addPhotoTile}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ri-image-add-line" />
                <span>Ongeza Picha</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            style={{ display: 'none' }}
          />

          {photos.length === 0 && (
            <>
              <p className={styles.hint} style={{ marginTop: 10 }}>Au chagua template badala ya picha:</p>
              <div className={styles.imageGrid}>
                {IMAGE_PRESETS.map((preset, i) => {
                  const selected = presetImages[0] === preset;
                  return (
                    <button
                      type="button"
                      key={i}
                      className={styles.imageSwatch}
                      onClick={() => toggleImage(preset)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt="" className={styles.photoThumb} />
                      {selected && (
                        <span className={styles.imageOrder}>
                          <i className="ri-check-line" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {photos.length > 1 && (
            <p className={styles.previewNote}>
              <i className="ri-information-line" /> Zitaonekana kama picha {usedSlots} zinazopita kwenye chapisho
            </p>
          )}
        </div>

        <div className={styles.section}>
          <label className={styles.switchRow}>
            <span className={styles.sectionLabel} style={{ marginBottom: 0 }}>
              Ongeza kitufe cha hatua (CTA)
            </span>
            <span className={`${styles.switch} ${ctaOn ? styles.switchOn : ''}`} onClick={() => setCtaOn((v) => !v)}>
              <span className={styles.switchKnob} />
            </span>
          </label>

          {ctaOn && (
            <div className={styles.ctaFields}>
              <div className={styles.ctaTemplateGrid}>
                {CTA_ICON_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.icon}
                    className={`${styles.ctaTemplate} ${ctaLabel === p.label && ctaIcon === p.icon ? styles.ctaTemplateActive : ''}`}
                    onClick={() => {
                      setCtaLabel(p.label);
                      setCtaIcon(p.icon);
                    }}
                  >
                    <i className={p.icon} />
                    {p.label}
                  </button>
                ))}
              </div>
              {ctaLabel.trim() && (
                <>
                  <input
                    type="url"
                    inputMode="url"
                    className={styles.ctaUrlInput}
                    placeholder="Kiungo (mfano: shop.com/item)"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                  <a
                    href={normalizeUrl(ctaUrl) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btnAccent ${styles.ctaPreview}`}
                    onClick={(e) => !ctaUrl.trim() && e.preventDefault()}
                  >
                    <i className={ctaIcon} />
                    {ctaLabel}
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {submitError && <p className={styles.formError}>{submitError}</p>}

        <button
          type="submit"
          className={`btnAccent ${styles.submit}`}
          disabled={!text.trim() || posting || (ctaOn && !!ctaLabel.trim() && !ctaUrl.trim())}
        >
          {posting ? <i className={`ri-loader-4-line ${styles.spin}`} /> : 'Chapisha'}
        </button>
      </form>
    </div>
  );
}
