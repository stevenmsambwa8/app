'use client'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, setMode, onClose }) {
  const { signInWithPhone, signUpWithPhone } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = e.target;
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const username = form.username?.value?.trim();

    if (!/^\d{6}$/.test(password)) {
      setError('PIN lazima iwe namba 6.');
      return;
    }

    setSubmitting(true);
    const { error } = isSignup
      ? await signUpWithPhone(phone, password, username)
      : await signInWithPhone(phone, password);
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
              <input name="username" type="text" autoComplete="username" placeholder="mfano: baraka22" required />
            </div>
          )}
          <div className={styles.field}>
            <label>Namba ya simu</label>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="mfano: 0712 345 678"
              required
            />
          </div>
          <div className={styles.field}>
            <label>PIN (namba 6)</label>
            <div className={styles.passwordRow}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="••••••"
                required
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                }}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ficha PIN' : 'Onyesha PIN'}
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            </div>
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
