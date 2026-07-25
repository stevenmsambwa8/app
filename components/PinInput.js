'use client'
import { useRef, useEffect } from 'react'
import styles from './PinInput.module.css'

// Six visual boxes driven by one real, invisible input — this is the
// standard pattern for PIN/OTP-style entry: it keeps native mobile
// numeric-keyboard behavior, paste, and backspace all working for free,
// instead of juggling focus across six separate <input> boxes by hand.
export default function PinInput({ value, onChange, status = 'idle', disabled, autoFocus, name }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const cells = Array.from({ length: 6 }, (_, i) => value[i] || '');

  return (
    <div
      className={`${styles.wrap} ${status === 'error' ? styles.shake : ''}`}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        name={name}
        type="password"
        inputMode="numeric"
        pattern="\d*"
        autoComplete="off"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className={styles.hiddenInput}
        aria-label="PIN"
      />
      {cells.map((d, i) => (
        <div
          key={i}
          className={[
            styles.box,
            d ? styles.boxFilled : '',
            status === 'error' ? styles.boxError : '',
            status === 'success' ? styles.boxSuccess : '',
          ].join(' ')}
        >
          {d ? '•' : ''}
        </div>
      ))}
    </div>
  );
}
