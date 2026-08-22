'use client'
import { useEffect, useRef, useState } from 'react'
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
  const { user, profile, loading, updateBusinessInfo, resolveMentionUsername } = useAuth();
  const { openAuth } = useAuthModal();

  const isBusiness = profile?.account_type === 'business';

  const [categoryInput, setCategoryInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');
  const [mentionStatus, setMentionStatus] = useState(null); // null | 'checking' | 'ok' | 'err'
  const [saving, setSaving] = useState(false);
  const [turningOff, setTurningOff] = useState(false);
  const [error, setError] = useState('');
  const mentionCheckId = useRef(0);

  useEffect(() => {
    if (!profile) return;
    setCategoryInput(profile.business_category || '');
    setWhatsappInput(profile.whatsapp || '');
    setNameInput(profile.business_name || '');
    setDescriptionInput(profile.business_description || '');
    setEmailInput(profile.business_email || '');
    setAddressInput(profile.business_address || '');
    setWebsiteInput(profile.business_website || '');
    setHoursInput(profile.business_hours || '');
    setMentionInput(profile.mention_username ? `@${profile.mention_username}` : '');
    setMentionStatus(profile.mention_username ? 'ok' : null);
  }, [profile]);

  // Debounced lookup so the mention field confirms the username is real
  // before it can be saved — same idea as the @mention autolink in posts
  // (lib/richText.js), just checked against the profiles table directly.
  useEffect(() => {
    const clean = mentionInput.replace(/^@/, '').trim();
    if (!clean) {
      setMentionStatus(null);
      return;
    }
    if (!/^[a-zA-Z0-9_]{2,30}$/.test(clean)) {
      setMentionStatus('err');
      return;
    }
    setMentionStatus('checking');
    const myCheckId = ++mentionCheckId.current;
    const t = setTimeout(async () => {
      const resolved = await resolveMentionUsername(clean);
      if (mentionCheckId.current !== myCheckId) return; // a newer keystroke superseded this
      setMentionStatus(resolved ? 'ok' : 'err');
    }, 400);
    return () => clearTimeout(t);
  }, [mentionInput, resolveMentionUsername]);

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
  const mentionBlocksSubmit = mentionStatus === 'checking' || mentionStatus === 'err';

  function buildExtraFields() {
    return {
      businessName: nameInput.trim() || null,
      businessDescription: descriptionInput.trim() || null,
      businessEmail: emailInput.trim() || null,
      businessAddress: addressInput.trim() || null,
      businessWebsite: websiteInput.trim() || null,
      businessHours: hoursInput.trim() || null,
      mentionUsername: mentionInput.trim() ? mentionInput.trim().replace(/^@/, '') : null,
    };
  }

  async function handleActivate() {
    if (!canSubmit) {
      setError('Jaza aina ya biashara na namba ya WhatsApp ili kuendelea.');
      return;
    }
    if (mentionBlocksSubmit) {
      setError('Jina la mtumiaji ulilotaja halipo. Angalia tena au liache tupu.');
      return;
    }
    setError('');
    setSaving(true);
    const { error: err } = await updateBusinessInfo({
      accountType: 'business',
      businessCategory: categoryInput.trim(),
      whatsapp: whatsappInput.trim(),
      ...buildExtraFields(),
    });
    setSaving(false);
    if (err) {
      setError(err.message || 'Imeshindwa kuanzisha akaunti ya biashara.');
      return;
    }
    router.replace('/profile');
  }

  async function handleSaveDetails() {
    if (mentionBlocksSubmit) {
      setError('Jina la mtumiaji ulilotaja halipo. Angalia tena au liache tupu.');
      return;
    }
    setError('');
    setSaving(true);
    const { error: err } = await updateBusinessInfo({
      businessCategory: categoryInput.trim() || null,
      whatsapp: whatsappInput.trim() || null,
      ...buildExtraFields(),
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

        <p className={styles.sectionTitle}>Taarifa za Biashara</p>

        <label className={styles.label}>Jina la Biashara</label>
        <input
          className={styles.input}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={60}
          placeholder="Mfano: Duka la Amina"
        />

        <label className={styles.label}>Maelezo</label>
        <textarea
          className={styles.textarea}
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          maxLength={300}
          placeholder="Eleza biashara yako kwa ufupi…"
        />

        <label className={styles.label}>Barua pepe</label>
        <input
          className={styles.input}
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Mfano: mauzo@biashara.co.tz"
        />

        <label className={styles.label}>Anwani / Mahali</label>
        <input
          className={styles.input}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          maxLength={120}
          placeholder="Mfano: Kariakoo, Dar es Salaam"
        />

        <label className={styles.label}>Tovuti</label>
        <input
          className={styles.input}
          type="url"
          value={websiteInput}
          onChange={(e) => setWebsiteInput(e.target.value)}
          placeholder="Mfano: https://biashara.co.tz"
        />

        <label className={styles.label}>Saa za Kufungua</label>
        <input
          className={styles.input}
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          maxLength={80}
          placeholder="Mfano: Jumatatu–Jumamosi, 8am–6pm"
        />

        <label className={styles.label}>Mtaje Mtumiaji (Mtu wa Kuwasiliana Naye)</label>
        <div className={styles.mentionRow}>
          <input
            className={styles.input}
            value={mentionInput}
            onChange={(e) => setMentionInput(e.target.value)}
            maxLength={31}
            placeholder="@jina_la_mtumiaji"
          />
        </div>
        <p className={styles.hint}>
          Hiari — taja akaunti ya mtumiaji itakayoonekana kwenye wasifu wako wa biashara kama mtu wa kuwasiliana naye.
        </p>
        {mentionStatus === 'checking' && <p className={styles.mentionStatus}>Inaangalia…</p>}
        {mentionStatus === 'ok' && <p className={`${styles.mentionStatus} ${styles.mentionOk}`}>Mtumiaji amepatikana ✓</p>}
        {mentionStatus === 'err' && <p className={`${styles.mentionStatus} ${styles.mentionErr}`}>Hakuna mtumiaji mwenye jina hilo.</p>}

        {error && <p className={styles.error}>{error}</p>}

        {isBusiness ? (
          <button type="button" className="btnAccent" onClick={handleSaveDetails} disabled={saving || mentionStatus === 'checking'}>
            {saving ? 'Inahifadhi…' : 'Hifadhi Mabadiliko'}
          </button>
        ) : (
          <button type="button" className="btnAccent" onClick={handleActivate} disabled={saving || mentionStatus === 'checking'}>
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
