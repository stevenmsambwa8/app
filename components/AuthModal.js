'use client'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, setMode, onClose }) {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const username = form.username?.value?.trim();

    setSubmitting(true);
    const { error } = isSignup
      ? await signUpWithPassword(email, password, username)
      : await signInWithPassword(email, password);
    setSubmitting(false);

    if (error) {
      setError(error.message || 'Hitilafu imetokea. Jaribu tena.');
      return;
    }
    onClose();
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
            onClick={() => { setMode('signin'); setError(''); }}
            type="button"
          >
            Ingia
          </button>
          <button
            className={`${styles.tab} ${isSignup ? styles.tabActive : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
            type="button"
          >
            Jisajili
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignup && (
            <div className={styles.field}>
              <label>Jina la mtumiaji</label>
              <input name="username" type="text" placeholder="mfano: baraka22" required />
            </div>
          )}
          <div className={styles.field}>
            <label>Barua pepe</label>
            <input name="email" type="email" placeholder="wewe@mfano.com" required />
          </div>
          <div className={styles.field}>
            <label>Nywila</label>
            <input name="password" type="password" placeholder="••••••••" required minLength={6} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

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
            onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); }}
          >
            {isSignup ? 'Ingia' : 'Jisajili'}
          </button>
        </p>
      </div>
    </div>
  );
}
