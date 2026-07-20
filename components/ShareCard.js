'use client'
import { useEffect, useState } from 'react'
import styles from './ShareCard.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

export default function ShareCard({ post, author, previewImg, snippetText, onClose }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/post/${post.id}`);
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, [post.id]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const shareText = `Angalia chapisho la ${author?.name || 'mtumiaji'} kwenye Advat`;
  const showImg = previewImg && isImageUrl(previewImg);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore, link is still visible/selectable
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'Advat', text: shareText, url });
      onClose();
    } catch {
      // user cancelled the native share sheet — no-op
    }
  }

  const links = url
    ? [
        {
          key: 'whatsapp',
          label: 'WhatsApp',
          icon: 'ri-whatsapp-fill',
          color: '#25D366',
          href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
        },
        {
          key: 'twitter',
          label: 'X',
          icon: 'ri-twitter-x-fill',
          color: '#111',
          href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
        },
        {
          key: 'facebook',
          label: 'Facebook',
          icon: 'ri-facebook-fill',
          color: '#1877F2',
          href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        },
        {
          key: 'telegram',
          label: 'Telegram',
          icon: 'ri-telegram-fill',
          color: '#26A5E4',
          href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
        },
      ]
    : [];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sambaza chapisho"
      >
        <div className={styles.handle} />

        <div className={styles.head}>
          <h3 className={styles.title}>Sambaza Chapisho</h3>
          <button className={styles.close} onClick={onClose} aria-label="Funga">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className={styles.preview}>
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImg} alt="" className={styles.previewImg} />
          ) : (
            <div className={styles.previewImg} style={{ background: previewImg || 'var(--chip-bg)' }} />
          )}
          <div className={styles.previewText}>
            <span className={styles.previewName}>{author?.name || 'Advat'}</span>
            {snippetText && <p className={styles.previewSnippet}>{snippetText}</p>}
          </div>
        </div>

        <div className={styles.linkRow}>
          <input
            readOnly
            value={url}
            className={styles.linkInput}
            onFocus={(e) => e.target.select()}
            aria-label="Kiungo cha chapisho"
          />
          <button type="button" className={styles.copyBtn} onClick={handleCopy}>
            <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
            {copied ? 'Imenakiliwa' : 'Nakili'}
          </button>
        </div>

        <div className={styles.grid}>
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.gridItem}
              onClick={onClose}
            >
              <span className={styles.gridIcon} style={{ background: l.color }}>
                <i className={l.icon} />
              </span>
              <span>{l.label}</span>
            </a>
          ))}
          {canNativeShare && (
            <button type="button" className={styles.gridItem} onClick={handleNativeShare}>
              <span className={styles.gridIcon} style={{ background: 'var(--text-dim)' }}>
                <i className="ri-share-forward-line" />
              </span>
              <span>Zaidi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
