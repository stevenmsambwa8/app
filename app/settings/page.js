'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { useTheme } from '../../components/ThemeProvider'
import Avatar from '../../components/Avatar'
import styles from './page.module.css'

function Switch({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`${styles.switch} ${on ? styles.on : ''}`}
      onClick={onClick}
    >
      <span className={styles.switchKnob} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const { openAuth } = useAuthModal();
  const { theme, toggleTheme } = useTheme();

  // Client-only for now — there's no notification-preferences table/column
  // in Supabase yet, so these switches don't persist across a reload or
  // another device. Wire them to a real column before shipping this as-is.
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followsNotif, setFollowsNotif] = useState(true);
  const [dmNotif, setDmNotif] = useState(true);

  if (loading) return null;

  if (!user) {
    return (
      <div className={styles.wrap} style={{ textAlign: 'center', paddingTop: 48 }}>
        <p style={{ marginBottom: 16 }}>Ingia ili kufikia mipangilio.</p>
        <button className="btnAccent" onClick={() => openAuth('signin')}>
          Ingia / Jisajili
        </button>
      </div>
    );
  }

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Wewe';
  const isBusiness = profile?.account_type === 'business';
  const isPhoneAccount = !!user?.email?.endsWith('@phone.advat.local');
  const accountValue = isPhoneAccount ? 'Namba ya simu' : (user?.email || '');

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button type="button" className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <span className={styles.headTitle}>Mipangilio</span>
      </div>

      <Link href="/profile" className={styles.profileCard}>
        <Avatar emoji={profile?.avatar || '🐧'} src={profile?.avatar_url} alt={displayName} size={44} />
        <div className={styles.profileText}>
          <span className={styles.profileName}>{displayName}</span>
          <span className={styles.profileHandle}>Hariri wasifu wako</span>
        </div>
        <i className="ri-arrow-right-s-line" />
      </Link>

      <p className={styles.sectionTitle}>Akaunti</p>
      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className={isPhoneAccount ? 'ri-smartphone-line' : 'ri-mail-line'} /></span>
          <span className={styles.rowLabel}>
            <span>{isPhoneAccount ? 'Namba ya Kuingia' : 'Barua Pepe ya Kuingia'}</span>
            <span className={styles.rowSub}>Hii ndiyo unayotumia kuingia kwenye akaunti yako</span>
          </span>
          <span className={styles.rowValue}>{accountValue}</span>
        </div>
        <Link href="/business" className={styles.row}>
          <span className={styles.rowIcon}><i className="ri-store-2-line" /></span>
          <span className={styles.rowLabel}>
            <span>Akaunti ya Biashara</span>
            <span className={styles.rowSub}>{isBusiness ? 'Imewashwa — hariri taarifa za biashara' : 'Fungua zana za kuuza kwenye Advat'}</span>
          </span>
          <i className={`${styles.rowChevron} ri-arrow-right-s-line`} />
        </Link>
      </div>

      <p className={styles.sectionTitle}>Muonekano</p>
      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className={theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line'} /></span>
          <span className={styles.rowLabel}>
            <span>Mandhari ya Giza</span>
            <span className={styles.rowSub}>{theme === 'dark' ? 'Imewashwa' : 'Imezimwa'}</span>
          </span>
          <Switch on={theme === 'dark'} onClick={toggleTheme} label="Mandhari ya giza" />
        </div>
      </div>

      <p className={styles.sectionTitle}>Arifa</p>
      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className="ri-heart-3-line" /></span>
          <span className={styles.rowLabel}><span>Mapendo</span></span>
          <Switch on={likesNotif} onClick={() => setLikesNotif((v) => !v)} label="Arifa za mapendo" />
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className="ri-chat-3-line" /></span>
          <span className={styles.rowLabel}><span>Maoni</span></span>
          <Switch on={commentsNotif} onClick={() => setCommentsNotif((v) => !v)} label="Arifa za maoni" />
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className="ri-user-add-line" /></span>
          <span className={styles.rowLabel}><span>Wafuasi Wapya</span></span>
          <Switch on={followsNotif} onClick={() => setFollowsNotif((v) => !v)} label="Arifa za wafuasi wapya" />
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}><i className="ri-mail-send-line" /></span>
          <span className={styles.rowLabel}><span>Ujumbe Binafsi</span></span>
          <Switch on={dmNotif} onClick={() => setDmNotif((v) => !v)} label="Arifa za ujumbe binafsi" />
        </div>
      </div>
      <p className={styles.hint}>
        Mapendeleo ya arifa hapo juu ni ya kifaa hiki tu kwa sasa — hayahifadhiwi bado kwenye akaunti yako.
      </p>

      <p className={styles.sectionTitle}>Faragha</p>
      <div className={styles.group}>
        <div className={styles.row} style={{ opacity: 0.6 }}>
          <span className={styles.rowIcon}><i className="ri-shield-user-line" /></span>
          <span className={styles.rowLabel}>
            <span>Nani Anaweza Kukutafuta</span>
            <span className={styles.rowSub}>Inakuja hivi karibuni</span>
          </span>
        </div>
      </div>

      <p className={styles.sectionTitle}>Akaunti</p>
      <div className={styles.group}>
        <button type="button" className={`${styles.row} ${styles.dangerRow}`} onClick={signOut}>
          <span className={styles.rowIcon}><i className="ri-logout-box-line" /></span>
          <span className={styles.rowLabel}><span>Toka Kwenye Akaunti</span></span>
        </button>
      </div>

      <p className={styles.version}>Advat</p>
    </div>
  );
}
