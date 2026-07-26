'use client'
import { useEffect, useState } from 'react'
import styles from './PhoneConfirmModal.module.css'

// Intercepts taps on any auto-detected phone number (rendered by
// lib/richText.js as <a class="rich-phone" data-phone-confirm="...">)
// anywhere in the app — post captions, comments, DMs — and asks for
// confirmation + shows a liability disclaimer before actually dialing.
// A document-level *capture* listener means it always sees the click
// first, regardless of whatever other click handlers (e.g. "don't bubble
// to the post's onClick") sit between the link and the page root.
export default function PhoneConfirmProvider({ children }) {
  const [phone, setPhone] = useState(null);

  useEffect(() => {
    function handleClick(e) {
      const el = e.target.closest?.('[data-phone-confirm]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      setPhone(el.getAttribute('data-phone-confirm'));
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  function confirmCall() {
    const number = phone;
    setPhone(null);
    if (number) window.location.href = `tel:${number}`;
  }

  return (
    <>
      {children}
      {phone && (
        <div className={styles.backdrop} onClick={() => setPhone(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.iconWrap}>
              <i className="ri-phone-line" />
            </div>
            <h3 className={styles.title}>Piga simu {phone}?</h3>
            <p className={styles.warning}>
              Utaondoka Advat kupiga namba hii moja kwa moja. Advat haihusiki na
              biashara, malipo, au makubaliano yoyote yanayofanyika nje ya
              programu — hakikisha unamfahamu au unamwamini mtu unayemuita kabla
              ya kuendelea.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setPhone(null)}>
                Ghairi
              </button>
              <button type="button" className={styles.callBtn} onClick={confirmCall}>
                <i className="ri-phone-fill" />
                Piga Simu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
