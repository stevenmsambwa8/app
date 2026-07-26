'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '../../components/Avatar'
import Emoji from '../../components/Emoji'
import PostPreview from '../../components/PostPreview'
import { usePosts } from '../../components/PostsProvider'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { ME, VIBES, IMAGE_PRESETS, BACKGROUND_PRESETS, randomBackground, CTA_ICON_PRESETS, FEELINGS, QUICK_EMOJIS } from '../../lib/mockData'
import { encodeFeeling } from '../../lib/postText'
import styles from './page.module.css'

const MAX_IMAGES = 5;
const MAX_CHARS = 500;
const DRAFT_KEY = 'advat-create-draft';

// Adds https:// to bare domains like "shop.com" so the CTA always produces
// a valid, clickable link rather than a relative/broken href.
function normalizeUrl(raw) {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

// Turns a phone number like "+255 712 345 678" into a working wa.me link
// that opens a chat pre-filled with a short greeting.
function buildWhatsappLink(raw) {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return undefined;
  return `https://wa.me/${digits}?text=${encodeURIComponent('Habari, nimeona chapisho lako Advat.')}`;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { addPost, uploadPostImage } = usePosts();
  const { user, profile, loading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const isBusiness = profile?.account_type === 'business';

  const [text, setText] = useState('');
  const [tag, setTag] = useState(VIBES[0]);
  const [presetImages, setPresetImages] = useState([]);
  const [photos, setPhotos] = useState([]); // [{ localId, url, uploading, error, progress }]
  const [ctaOn, setCtaOn] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaIcon, setCtaIcon] = useState(CTA_ICON_PRESETS[0].icon);
  const [ctaUrl, setCtaUrl] = useState('');
  const [priceOn, setPriceOn] = useState(false);
  const [price, setPrice] = useState('');
  const [feeling, setFeeling] = useState(null); // { emoji, label }
  const [feelingSheetOpen, setFeelingSheetOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'preview'
  const [posting, setPosting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // The composer's sections (background, category, photos, CTA, price) can
  // be dragged into any order the person prefers. Order is tracked as an id
  // list; hidden/not-yet-enabled sections just stay parked in the list and
  // are skipped over when rendering + when picking drag targets.
  const [sectionOrder, setSectionOrder] = useState([
    'background',
    'category',
    'photos',
    'cta',
    'price',
  ]);
  const [draggingSection, setDraggingSection] = useState(null);
  const sectionRefs = useRef({});

  function isSectionVisible(id) {
    if (id === 'background') return bgOpen;
    if (id === 'cta') return ctaOn;
    if (id === 'price') return isBusiness && priceOn;
    return true; // category, photos are always shown
  }

  function handleSectionDragStart(id, e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingSection(id);
  }

  function handleSectionDragMove(id, e) {
    if (draggingSection !== id) return;
    const y = e.clientY;
    let hoverId = null;
    for (const sid of sectionOrder) {
      if (sid === id || !isSectionVisible(sid)) continue;
      const el = sectionRefs.current[sid];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        hoverId = sid;
        break;
      }
    }
    if (hoverId) {
      setSectionOrder((order) => {
        const next = [...order];
        const from = next.indexOf(id);
        const to = next.indexOf(hoverId);
        if (from === -1 || to === -1) return order;
        next.splice(from, 1);
        next.splice(to, 0, id);
        return next;
      });
    }
  }

  function handleSectionDragEnd() {
    setDraggingSection(null);
  }

  // Price and CTA are mutually exclusive — a post either sells at a price
  // or drives a click, never both — so turning one on switches the other off.
  function handleToggleCta() {
    setCtaOn((v) => {
      const next = !v;
      if (next) setPriceOn(false);
      return next;
    });
  }

  function handleTogglePrice() {
    setPriceOn((v) => {
      const next = !v;
      if (next) setCtaOn(false);
      return next;
    });
  }

  // Restore a saved draft once on mount (text/tag/feeling/preset background
  // only — real photo uploads don't survive a reload, so those aren't saved).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.text) setText(draft.text.slice(0, MAX_CHARS));
      if (draft.tag) setTag(draft.tag);
      if (draft.feeling) setFeeling(draft.feeling);
      if (draft.presetImages?.length) setPresetImages(draft.presetImages);
      if (draft.text || draft.feeling || draft.presetImages?.length) setDraftRestored(true);
    } catch {
      // ignore corrupt/unavailable storage
    }
  }, []);

  // Autosave the draft (debounced) whenever the composable fields change.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (!text.trim() && !feeling && !presetImages.length) {
          window.localStorage.removeItem(DRAFT_KEY);
          return;
        }
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, tag, feeling, presetImages }));
      } catch {
        // ignore storage errors (private mode, quota, etc.)
      }
    }, 400);
    return () => clearTimeout(id);
  }, [text, tag, feeling, presetImages]);

  function discardDraft() {
    setText('');
    setFeeling(null);
    setPresetImages([]);
    setDraftRestored(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }

  const usedSlots = photos.length + presetImages.length;
  const uploadingPhotos = photos.filter((p) => p.uploading);
  const isUploading = uploadingPhotos.length > 0;
  const overallProgress = isUploading
    ? Math.round(uploadingPhotos.reduce((sum, p) => sum + p.progress, 0) / uploadingPhotos.length)
    : 0;
  const charsLeft = MAX_CHARS - text.length;

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

  function togglePreset(preset) {
    // Templates and gradient backgrounds share one slot and are single-select
    // — picking one replaces whatever was picked before (tapping the current
    // pick clears it).
    setPresetImages((imgs) => (imgs[0] === preset ? [] : [preset]));
  }

  function insertEmoji(emoji) {
    setText((t) => (t.length + emoji.length <= MAX_CHARS ? t + emoji : t));
    textareaRef.current?.focus();
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
      setPhotos((p) => [...p, { localId, url: null, uploading: true, error: '', progress: 4 }]);

      // Supabase's storage client doesn't expose real upload progress, so we
      // simulate a smooth climb (capped short of 100) while the compress +
      // upload work happens, then snap to 100% the moment it actually resolves.
      const tick = setInterval(() => {
        setPhotos((p) =>
          p.map((ph) =>
            ph.localId === localId && ph.uploading
              ? { ...ph, progress: Math.min(ph.progress + Math.random() * 16 + 5, 92) }
              : ph
          )
        );
      }, 200);

      const { url, error } = await uploadPostImage(file);
      clearInterval(tick);

      setPhotos((p) =>
        p.map((ph) =>
          ph.localId === localId
            ? { ...ph, uploading: false, url: url || null, error: error ? error.message : '', progress: 100 }
            : ph
        )
      );
    }
  }

  function removePhoto(localId) {
    setPhotos((p) => p.filter((ph) => ph.localId !== localId));
  }

  function clearAllPhotos() {
    setPhotos([]);
    setPresetImages([]);
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
    const finalImages = uploadedUrls.length ? uploadedUrls : presetImages.length ? presetImages : [randomBackground()];
    const finalText = encodeFeeling(text.trim(), feeling);
    const activeCtaPreset = CTA_ICON_PRESETS.find((p) => p.icon === ctaIcon && p.label === ctaLabel);
    const ctaFinalUrl = activeCtaPreset?.whatsapp ? buildWhatsappLink(ctaUrl) : normalizeUrl(ctaUrl);

    const { error } = await addPost({
      text: finalText,
      tag,
      images: finalImages.length ? finalImages : undefined,
      cta:
        ctaOn && ctaLabel.trim()
          ? { label: ctaLabel.trim(), icon: ctaIcon, url: ctaFinalUrl }
          : undefined,
      price: isBusiness && priceOn && price.trim() ? Number(price) : null,
    });

    setPosting(false);

    if (error) {
      setSubmitError(error.message || 'Imeshindwa kuchapisha. Jaribu tena.');
      return;
    }
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    router.push('/feed');
  }

  const displayName = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || ME.name;
  const canSubmit =
    !!text.trim() &&
    !posting &&
    !isUploading &&
    !(ctaOn && !!ctaLabel.trim() && !ctaUrl.trim()) &&
    !(priceOn && (!price.trim() || Number(price) <= 0));

  const previewUploadedUrls = photos.filter((p) => p.url).map((p) => p.url);
  const previewImages = previewUploadedUrls.length ? previewUploadedUrls : presetImages;
  const previewCta = ctaOn && ctaLabel.trim() ? { label: ctaLabel.trim(), icon: ctaIcon } : null;
  const previewAuthor = {
    name: displayName,
    avatar: profile?.avatar || ME.avatar,
    avatarUrl: profile?.avatar_url,
    badge: profile?.badge,
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <h1 className={styles.title}>Unda Chapisho</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'create' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <i className="ri-edit-2-line" />
          Unda
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <i className="ri-eye-line" />
          Onyesho la Awali
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.createPane} style={{ display: activeTab === 'create' ? 'flex' : 'none' }}>
        <div className={styles.who}>
          <Avatar emoji={profile?.avatar || ME.avatar} src={profile?.avatar_url} size={40} ring />
          <div className={styles.whoText}>
            <div className={styles.name}>{displayName}</div>
            {feeling ? (
              <span className={styles.feelingChip}>
                anasikia <Emoji emoji={feeling.emoji} /> {feeling.label}
                <button type="button" onClick={() => setFeeling(null)} aria-label="Ondoa hisia">
                  <i className="ri-close-line" />
                </button>
              </span>
            ) : (
              <div className={styles.handle}>@{displayName}</div>
            )}
          </div>
        </div>

        <div className={styles.textareaWrap}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Flex kitu leo..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            rows={4}
            autoFocus
            maxLength={MAX_CHARS}
          />
          <span className={`${styles.charCount} ${charsLeft <= 20 ? styles.charCountLow : ''}`}>
            {text.length}/{MAX_CHARS}
          </span>
        </div>

        {emojiOpen && (
          <div className={styles.emojiStrip}>
            {QUICK_EMOJIS.map((em) => (
              <button type="button" key={em} className={styles.emojiBtn} onClick={() => insertEmoji(em)}>
                <Emoji emoji={em} size="1.3em" />
              </button>
            ))}
          </div>
        )}

        <div className={styles.toolsRow}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={usedSlots >= MAX_IMAGES}
          >
            <i className="ri-image-add-line" />
            <span>Picha</span>
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => setFeelingSheetOpen(true)}>
            <i className="ri-emotion-line" />
            <span>Hisia</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${emojiOpen ? styles.toolBtnActive : ''}`}
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <i className="ri-sticky-note-add-line" />
            <span>Emoji</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${ctaOn ? styles.toolBtnActive : ''}`}
            onClick={handleToggleCta}
            disabled={priceOn}
            title={priceOn ? 'Ondoa bei kwanza' : undefined}
          >
            <i className="ri-link-m" />
            <span>Kiungo</span>
          </button>
          {isBusiness && (
            <button
              type="button"
              className={`${styles.toolBtn} ${priceOn ? styles.toolBtnActive : ''}`}
              onClick={handleTogglePrice}
              disabled={ctaOn}
              title={ctaOn ? 'Ondoa kiungo kwanza' : undefined}
            >
              <i className="ri-price-tag-3-line" />
              <span>Bei</span>
            </button>
          )}
          <button
            type="button"
            className={`${styles.toolBtn} ${bgOpen ? styles.toolBtnActive : ''}`}
            onClick={() => setBgOpen((v) => !v)}
            disabled={photos.length > 0}
          >
            <i className="ri-palette-line" />
            <span>Rangi</span>
          </button>
        </div>

        {draftRestored && (
          <div className={styles.draftBanner}>
            <i className="ri-draft-line" />
            <span>Rasimu imerejeshwa</span>
            <button type="button" onClick={discardDraft}>
              Futa
            </button>
          </div>
        )}

        {sectionOrder.map((id) => {
          if (!isSectionVisible(id)) return null;
          const dragHandle = (
            <button
              type="button"
              className={styles.dragHandle}
              onPointerDown={(e) => handleSectionDragStart(id, e)}
              onPointerMove={(e) => handleSectionDragMove(id, e)}
              onPointerUp={handleSectionDragEnd}
              onPointerCancel={handleSectionDragEnd}
              aria-label="Hamisha sehemu hii"
            >
              <i className="ri-draggable" />
            </button>
          );

          if (id === 'background') {
            return (
              <div
                key={id}
                ref={(el) => { sectionRefs.current[id] = el; }}
                className={`${styles.dragSection} ${draggingSection === id ? styles.dragSectionActive : ''}`}
              >
                {dragHandle}
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Rangi ya Nyuma</p>
                  <div className={styles.bgRow}>
                    {BACKGROUND_PRESETS.map((bg, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`${styles.bgSwatch} ${presetImages[0] === bg ? styles.bgSwatchActive : ''}`}
                        style={{ background: bg }}
                        onClick={() => togglePreset(bg)}
                        aria-label="Chagua rangi ya nyuma"
                      >
                        {presetImages[0] === bg && <i className="ri-check-line" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (id === 'category') {
            return (
              <div
                key={id}
                ref={(el) => { sectionRefs.current[id] = el; }}
                className={`${styles.dragSection} ${draggingSection === id ? styles.dragSectionActive : ''}`}
              >
                {dragHandle}
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
              </div>
            );
          }

          if (id === 'photos') {
            return (
              <div
                key={id}
                ref={(el) => { sectionRefs.current[id] = el; }}
                className={`${styles.dragSection} ${draggingSection === id ? styles.dragSectionActive : ''}`}
              >
                {dragHandle}
                <div className={styles.section}>
                  <div className={styles.sectionHeadRow}>
                    <p className={styles.sectionLabel} style={{ marginBottom: 0 }}>
                      Picha ({usedSlots}/{MAX_IMAGES}) <span className={styles.hint}>zimebanwa kiotomatiki hadi 20KB kila moja</span>
                    </p>
                    {usedSlots > 0 && (
                      <button type="button" className={styles.clearAllBtn} onClick={clearAllPhotos}>
                        Futa zote
                      </button>
                    )}
                  </div>
                  <div className={styles.imageGrid}>
                    {photos.map((p) => (
                      <div key={p.localId} className={styles.imageSwatch}>
                        {p.uploading ? (
                          <div className={styles.photoStatus}>
                            <span className={styles.progressPct}>{Math.round(p.progress)}%</span>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
                            </div>
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

                  {isUploading && (
                    <p className={styles.uploadSummary}>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} />
                      Inapakia picha {uploadingPhotos.length}... {overallProgress}%
                    </p>
                  )}

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
                              onClick={() => togglePreset(preset)}
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
              </div>
            );
          }

          if (id === 'cta') {
            return (
              <div
                key={id}
                ref={(el) => { sectionRefs.current[id] = el; }}
                className={`${styles.dragSection} ${draggingSection === id ? styles.dragSectionActive : ''}`}
              >
                {dragHandle}
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Kitufe cha hatua (CTA)</p>
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
                        {CTA_ICON_PRESETS.find((p) => p.icon === ctaIcon && p.label === ctaLabel)?.whatsapp ? (
                          <input
                            type="tel"
                            inputMode="tel"
                            className={styles.ctaUrlInput}
                            placeholder="Namba ya WhatsApp (mfano: 255712345678)"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                          />
                        ) : (
                          <input
                            type="url"
                            inputMode="url"
                            className={styles.ctaUrlInput}
                            placeholder="Kiungo (mfano: shop.com/item)"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                          />
                        )}
                        <a
                          href={
                            (CTA_ICON_PRESETS.find((p) => p.icon === ctaIcon && p.label === ctaLabel)?.whatsapp
                              ? buildWhatsappLink(ctaUrl)
                              : normalizeUrl(ctaUrl)) || undefined
                          }
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
                </div>
              </div>
            );
          }

          if (id === 'price') {
            return (
              <div
                key={id}
                ref={(el) => { sectionRefs.current[id] = el; }}
                className={`${styles.dragSection} ${draggingSection === id ? styles.dragSectionActive : ''}`}
              >
                {dragHandle}
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Bei ya bidhaa</p>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    className={styles.ctaUrlInput}
                    placeholder="Bei (TZS), mfano: 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <p className={styles.previewNote}>
                    <i className="ri-information-line" /> Chapisho hili litapata kitufe cha &quot;Ongeza Kikapuni&quot; wateja wataponunua.
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })}
        </div>

        <div className={styles.previewPane} style={{ display: activeTab === 'preview' ? 'flex' : 'none' }}>
          <PostPreview
            author={previewAuthor}
            text={text}
            feeling={feeling}
            tag={tag}
            images={previewImages}
            cta={previewCta}
            price={priceOn ? price : null}
          />
          <p className={styles.previewPaneHint}>
            Hivi ndivyo chapisho lako litakavyoonekana kwenye mlisho. Gusa &quot;Unda&quot; kuendelea kuhariri.
          </p>
        </div>

        {submitError && <p className={styles.formError}>{submitError}</p>}

        <div className={styles.footerSpacer} />
        <div className={styles.footerBar}>
          <button type="submit" className={`btnAccent ${styles.submit}`} disabled={!canSubmit}>
            {posting ? (
              <i className={`ri-loader-4-line ${styles.spin}`} />
            ) : isUploading ? (
              `Inapakia... ${overallProgress}%`
            ) : (
              'Chapisha'
            )}
          </button>
        </div>
      </form>

      {feelingSheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setFeelingSheetOpen(false)}>
          <div className={styles.sheetContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <p className={styles.sheetTitle}>Unasikiaje?</p>
            <div className={styles.feelingGrid}>
              {FEELINGS.map((f) => (
                <button
                  type="button"
                  key={f.label}
                  className={`${styles.feelingOption} ${feeling?.label === f.label ? styles.feelingOptionActive : ''}`}
                  onClick={() => {
                    setFeeling(feeling?.label === f.label ? null : f);
                    setFeelingSheetOpen(false);
                  }}
                >
                  <span className={styles.feelingEmoji}><Emoji emoji={f.emoji} size="1.4em" /></span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
