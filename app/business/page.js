'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import styles from './page.module.css'

const BENEFITS = [
  { icon: 'ri-price-tag-3-fill', text: 'Weka bei kwenye machapisho yako na yaonekane kwenye kichupo cha Bidhaa' },
  { icon: 'ri-whatsapp-fill', text: 'Kitufe cha WhatsApp kwenye wasifu wako ili wateja wakupate haraka' },
  { icon: 'ri-bar-chart-2-fill', text: 'Takwimu za mauzo na mwitikio wa machapisho yako' },
];

export default function BusinessAccountPage() {
  const router = useRouter();
  const { user, profile, loading, updateBusinessInfo } = useAuth();
  const { openAuth } = useAuthModal();

  const isBusiness = profile?.account_type === 'business';

  const [categoryInput, setCategoryInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [turningOff, setTurningOff] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setCategoryInput(profile.business_category || '');
    setWhatsappInput(profile.whatsapp || '');
  }, [profile]);

  if (loading) return null;

  if (!user) {
    return (
      <div className={styles.wrap} style={{ textAlign: 'center', paddingTop: 48 }}>
        <p style={{ marginBottom: 16 }}>Ingia ili kusimamia akaunti ya biashara.</p>
        <button className="btnAccent" onClick={() => openAuth('signin')}>
          Ingia / Jisajili
        </button>
      </div>
    );
  }

  const canSubmit = categoryInput.trim().length > 0 && whatsappInput.trim().length > 0;

  async function handleActivate() {
    if (!canSubmit) {
      setError('Jaza aina ya biashara na namba ya WhatsApp ili kuendelea.');
      return;
    }
    setError('');
    setSaving(true);
    const { error: err } = await updateBusinessInfo({
      accountType: 'business',
      businessCategory: categoryInput.trim(),
      whatsapp: whatsappInput.trim(),
    });
    setSaving(false);
    if (err) {
      setError(err.message || 'Imeshindwa kuanzisha akaunti ya biashara.');
      return;
    }
    router.replace('/profile');
  }

  async function handleSaveDetails() {
    setError('');
    setSaving(true);
    const { error: err } = await updateBusinessInfo({
      businessCategory: categoryInput.trim() || null,
      whatsapp: whatsappInput.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message || 'Imeshindwa kuhifadhi taarifa.');
      return;
    }
    router.replace('/profile');
  }

  async function handleTurnOff() {
    if (!window.confirm('Una uhakika unataka kuzima akaunti ya biashara? Utarudi kuwa akaunti ya kawaida.')) return;
    setError('');
    setTurningOff(true);
    const { error: err } = await updateBusinessInfo({ accountType: 'personal' });
    setTurningOff(false);
    if (err) {
      setError(err.message || 'Imeshindwa kuzima akaunti ya biashara.');
      return;
    }
    router.replace('/profile');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button type="button" className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <span className={styles.headTitle}>
          {isBusiness ? 'Akaunti ya Biashara' : 'Fungua Akaunti ya Biashara'}
        </span>
      </div>

      {!isBusiness && (
        <>
          <div className={styles.iconBadge}>
            <i className="ri-store-2-fill" />
          </div>
          <h1 className={styles.title}>Badilisha kuwa Akaunti ya Biashara</h1>
          <p className={styles.subtitle}>
            Fungua zana za kuuza na kuwasiliana na wateja wako moja kwa moja kwenye Advat.
          </p>

          <div className={styles.benefits}>
            {BENEFITS.map((b) => (
              <div key={b.text} className={styles.benefitRow}>
                <span className={styles.benefitIcon}>
                  <i className={b.icon} />
                </span>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.form}>
        <label className={styles.label}>Aina ya Biashara</label>
        <input
          className={styles.input}
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          maxLength={40}
          placeholder="Mfano: Mavazi, Chakula, Vipodozi"
        />

        <label className={styles.label}>Namba ya WhatsApp</label>
        <input
          className={styles.input}
          type="tel"
          inputMode="tel"
          value={whatsappInput}
          onChange={(e) => setWhatsappInput(e.target.value)}
          placeholder="Mfano: 255712345678"
        />

        {error && <p className={styles.error}>{error}</p>}

        {isBusiness ? (
          <button type="button" className="btnAccent" onClick={handleSaveDetails} disabled={saving}>
            {saving ? 'Inahifadhi…' : 'Hifadhi Mabadiliko'}
          </button>
        ) : (
          <button type="button" className="btnAccent" onClick={handleActivate} disabled={saving}>
            {saving ? 'Inaanzisha…' : 'Anzisha Akaunti ya Biashara'}
          </button>
        )}
      </div>

      {isBusiness && (
        <div className={styles.dangerZone}>
          <p className={styles.dangerText}>
            Ukizima akaunti ya biashara, kitufe cha WhatsApp na kichupo cha Takwimu havitaonekana tena kwenye
            wasifu wako. Unaweza kuifungua tena wakati wowote.
          </p>
          <button type="button" className={styles.dangerBtn} onClick={handleTurnOff} disabled={turningOff}>
            {turningOff ? 'Inazima…' : 'Zima Akaunti ya Biashara'}
          </button>
        </div>
      )}
    </div>
  );
}
