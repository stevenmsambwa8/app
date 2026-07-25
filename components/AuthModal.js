'use client'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import PinInput from './PinInput'
import { normalizePhone, isValidPhone } from '../lib/phone'
import { getCachedLock, setCachedLock } from '../lib/loginLockout'
import styles from './AuthModal.module.css'

function minutesLeft(lockedUntil) {
  return Math.max(1, Math.ceil((new Date(lockedUntil) - new Date()) / 60000));
}

function lockedMessage(lockedUntil) {
  return `Umefungwa kwa muda. Jaribu tena baada ya dakika ${minutesLeft(lockedUntil)}.`;
}

export default function AuthModal({ mode, setMode, onClose }) {
  const { signInWithPhone, signUpWithPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinStatus, setPinStatus] = useState('idle'); // idle | error | success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(null);
  const isSignup = mode === 'signup';
  const locked = lockedUntil && new Date(lockedUntil) > new Date();

  function handlePhoneChange(value) {
    setPhone(value);
    setError('');
    const digits = normalizePhone(value);
    setLockedUntil(isValidPhone(digits) ? getCachedLock(digits) : null);
  }

  function resetPinAfterFeedback(nextStatus) {
    setTimeout(() => {
      setPinStatus('idle');
      if (nextStatus === 'error') setPin('');
    }, 500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const digits = normalizePhone(phone);

    if (!isValidPhone(digits)) {
      setError('Namba ya simu si sahihi.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN lazima iwe namba 6.');
      return;
    }

    // Instant local check — no network round trip needed to know an
    // account is still locked from a moment ago on this same device.
    if (!isSignup) {
      const cached = getCachedLock(digits);
      if (cached) {
        setLockedUntil(cached);
        setPinStatus('error');
        setError(lockedMessage(cached));
        resetPinAfterFeedback('error');
        return;
      }
    }

    setSubmitting(true);
    const result = isSignup
      ? await signUpWithPhone(phone, pin, username.trim())
      : await signInWithPhone(phone, pin);
    setSubmitting(false);

    if (result.error) {
      if (result.lockedUntil) {
        setCachedLock(digits, result.lockedUntil);
        setLockedUntil(result.lockedUntil);
      }
      setPinStatus('error');
      setError(result.lockedUntil ? lockedMessage(result.lockedUntil) : result.error.message);
      resetPinAfterFeedback('error');
      return;
    }

    setCachedLock(digits, null);
    setPinStatus('success');
    setTimeout(onClose, 350);
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
              <input
                name="username"
                type="text"
                autoComplete="username"
                placeholder="mfano: baraka22"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>PIN (namba 6)</label>
            <PinInput
              value={pin}
              onChange={setPin}
              status={pinStatus}
              disabled={locked}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btnAccent ${styles.submit}`} disabled={submitting || locked}>
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
