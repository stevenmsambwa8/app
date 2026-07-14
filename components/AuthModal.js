'use client'
import { useState } from 'react'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, setMode, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 700);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.close} onClick={onClose} aria-label="Funga">
          <i className="ri-close-line" />
        </button>

        <div className={styles.head}>
          <div className={styles.badge}>
            <i className="ri-sparkling-2-fill" />
          </div>
          <h2 className={styles.title}>
            {isSignup ? 'Karibu Advat' : 'Karibu tena'}
          </h2>
          <p className={styles.subtitle}>
            {isSignup
              ? 'Unda akaunti kuanza kuflex na jumuiya.'
              : 'Ingia kuendelea na safari yako ya Flex.'}
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${!isSignup ? styles.tabActive : ''}`}
            onClick={() => setMode('signin')}
            type="button"
          >
            Ingia
          </button>
          <button
            className={`${styles.tab} ${isSignup ? styles.tabActive : ''}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Jisajili
          </button>
        </div>

        <button type="button" className={styles.social}>
          <i className="ri-google-fill" />
          Endelea na Google
        </button>

        <div className={styles.divider}>
          <span />
          <p>au tumia barua pepe</p>
          <span />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignup && (
            <div className={styles.field}>
              <label>Jina la mtumiaji</label>
              <input type="text" placeholder="mfano: baraka22" required />
            </div>
          )}
          <div className={styles.field}>
            <label>Barua pepe</label>
            <input type="email" placeholder="wewe@mfano.com" required />
          </div>
          <div className={styles.field}>
            <label>Nywila</label>
            <input type="password" placeholder="••••••••" required minLength={6} />
          </div>

          {!isSignup && (
            <button type="button" className={styles.forgot}>
              Umesahau nywila?
            </button>
          )}

          <button type="submit" className={`btnAccent ${styles.submit}`} disabled={submitting}>
            {submitting ? (
              <i className={`ri-loader-4-line ${styles.spin}`} />
            ) : isSignup ? (
              'Fungua Akaunti'
            ) : (
              'Ingia'
            )}
          </button>
        </form>

        <p className={styles.switchRow}>
          {isSignup ? 'Una akaunti tayari?' : 'Huna akaunti?'}{' '}
          <button
            type="button"
            className={styles.switchLink}
            onClick={() => setMode(isSignup ? 'signin' : 'signup')}
          >
            {isSignup ? 'Ingia' : 'Jisajili'}
          </button>
        </p>
      </div>
    </div>
  );
}
