'use client'
import { useState } from 'react'
import { VIBES, FEELINGS } from '../lib/mockData'
import { parsePostText, encodeFeeling } from '../lib/postText'
import styles from './EditPostModal.module.css'

const MAX_CHARS = 500;

// Lightweight edit modal — lets an owner update their post's caption,
// category and feeling in place. Images stay as originally uploaded (full
// re-upload/reorder is a bigger feature than this covers) but everything
// text-driven about the post can be changed here.
export default function EditPostModal({ post, onClose, onSave }) {
  const parsed = parsePostText(post.text || '');
  const [text, setText] = useState(parsed.text);
  const [tag, setTag] = useState(post.tag || VIBES[0]);
  const [feeling, setFeeling] = useState(parsed.feeling);
  const [feelingSheetOpen, setFeelingSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const charsLeft = MAX_CHARS - text.length;
  const canSave = !!text.trim() && !saving;
  const hasImages = post.images && post.images.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError('');
    const finalText = encodeFeeling(text.trim(), feeling);
    const { error: saveError } = await onSave({ text: finalText, tag });
    setSaving(false);
    if (saveError) {
      setError(saveError.message || 'Imeshindwa kuhifadhi. Jaribu tena.');
      return;
    }
    onClose();
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <span className={styles.title}>Hariri Chapisho</span>
          <button className={styles.close} onClick={onClose} aria-label="Funga">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className={styles.body}>
          {hasImages && (
            <div className={styles.imgStrip}>
              {post.images.slice(0, 5).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className={styles.imgThumb} />
              ))}
            </div>
          )}

          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              rows={5}
              placeholder="Andika maoni yako..."
              autoFocus
            />
            <span className={`${styles.charCount} ${charsLeft < 20 ? styles.charCountLow : ''}`}>
              {charsLeft}
            </span>
          </div>

          {feeling ? (
            <div className={styles.feelingChip}>
              <button type="button" className={styles.feelingChipMain} onClick={() => setFeelingSheetOpen(true)}>
                {feeling.emoji} Anasikia {feeling.label}
              </button>
              <button type="button" onClick={() => setFeeling(null)} aria-label="Ondoa hisia">
                <i className="ri-close-line" />
              </button>
            </div>
          ) : (
            <button type="button" className={styles.feelingAdd} onClick={() => setFeelingSheetOpen(true)}>
              <i className="ri-emotion-happy-line" />
              Ongeza Hisia
            </button>
          )}

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

          {hasImages && (
            <p className={styles.hint}>
              <i className="ri-information-line" /> Picha za chapisho haziwezi kubadilishwa hapa.
            </p>
          )}

          {error && <p className={styles.formError}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={`btnAccent ${styles.saveBtn}`} disabled={!canSave} onClick={handleSave}>
            {saving ? <i className={`ri-loader-4-line ${styles.spin}`} /> : 'Hifadhi Mabadiliko'}
          </button>
        </div>
      </div>

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
                  <span className={styles.feelingEmoji}>{f.emoji}</span>
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
