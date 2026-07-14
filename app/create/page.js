'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '../../components/Avatar'
import { usePosts } from '../../components/PostsProvider'
import { ME, VIBES, IMAGE_PRESETS, CTA_ICON_PRESETS } from '../../lib/mockData'
import styles from './page.module.css'

export default function CreatePostPage() {
  const router = useRouter();
  const { addPost } = usePosts();

  const [text, setText] = useState('');
  const [tag, setTag] = useState(VIBES[0]);
  const [images, setImages] = useState([]);
  const [ctaOn, setCtaOn] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaIcon, setCtaIcon] = useState(CTA_ICON_PRESETS[0].icon);
  const [posting, setPosting] = useState(false);

  function toggleImage(preset) {
    setImages((imgs) =>
      imgs.includes(preset) ? imgs.filter((i) => i !== preset) : imgs.length < 5 ? [...imgs, preset] : imgs
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);

    const draft = {
      text: text.trim(),
      tag,
      images: images.length ? images : undefined,
      gradient: images.length ? undefined : null,
      cta: ctaOn && ctaLabel.trim() ? { label: ctaLabel.trim(), icon: ctaIcon } : undefined,
    };

    setTimeout(() => {
      addPost(draft);
      router.push('/feed');
    }, 400);
  }

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
          <Avatar emoji={ME.avatar} size={40} ring />
          <div>
            <div className={styles.name}>{ME.name}</div>
            <div className={styles.handle}>{ME.handle}</div>
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
            Picha ({images.length}/5) <span className={styles.hint}>gusa kuchagua, gusa tena kuondoa</span>
          </p>
          <div className={styles.imageGrid}>
            {IMAGE_PRESETS.map((preset, i) => {
              const idx = images.indexOf(preset);
              const selected = idx !== -1;
              return (
                <button
                  type="button"
                  key={i}
                  className={`${styles.imageSwatch} texture`}
                  style={{ background: preset }}
                  onClick={() => toggleImage(preset)}
                >
                  {selected && <span className={styles.imageOrder}>{idx + 1}</span>}
                </button>
              );
            })}
          </div>
          {images.length > 1 && (
            <p className={styles.previewNote}>
              <i className="ri-information-line" /> Zitaonekana kama picha {images.length} zinazopita kwenye chapisho
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
              <input
                type="text"
                className={styles.ctaInput}
                placeholder="mfano: Sikiliza Playlist"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                maxLength={30}
              />
              <div className={styles.iconRow}>
                {CTA_ICON_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.icon}
                    className={`${styles.iconChip} ${ctaIcon === p.icon ? styles.iconChipActive : ''}`}
                    onClick={() => setCtaIcon(p.icon)}
                    aria-label={p.label}
                  >
                    <i className={p.icon} />
                  </button>
                ))}
              </div>
              {ctaLabel.trim() && (
                <button type="button" className={`btnAccent ${styles.ctaPreview}`}>
                  <i className={ctaIcon} />
                  {ctaLabel}
                </button>
              )}
            </div>
          )}
        </div>

        <button type="submit" className={`btnAccent ${styles.submit}`} disabled={!text.trim() || posting}>
          {posting ? <i className={`ri-loader-4-line ${styles.spin}`} /> : 'Chapisha'}
        </button>
      </form>
    </div>
  );
}
