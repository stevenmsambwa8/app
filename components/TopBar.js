'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from './Avatar'
import { useTheme } from './ThemeProvider'
import { useAuthModal } from './AuthModalProvider'
import { useAuth } from './AuthProvider'
import { NOTIFS } from '../lib/mockData'
import styles from './TopBar.module.css'

export default function TopBar() {
  const pathname = usePathname();
  const unread = NOTIFS.filter((n) => n.unread).length;
  const { theme, toggleTheme } = useTheme();
  const { openAuth } = useAuthModal();
  const { user, signOut } = useAuth();

  if (pathname?.startsWith('/create') || pathname?.startsWith('/post/')) return null;

  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Wewe';

  return (
    <div className={styles.bar}>
      <Link href="/feed" className={styles.logo}>
        <Image
          src={theme === 'dark' ? '/advat-black.png' : '/advat-white.png'}
          alt="Advat"
          width={671}
          height={315}
          priority
          className={styles.logoImg}
        />
      </Link>
      <div className={styles.right}>
        {user ? (
          <button onClick={signOut} className={styles.themeBtn} aria-label="Toka">
            <i className="ri-logout-box-line" />
          </button>
        ) : (
          <button onClick={() => openAuth('signin')} className={styles.themeBtn} aria-label="Ingia au jisajili">
            <i className="ri-login-box-line" />
          </button>
        )}
        <button onClick={toggleTheme} className={styles.themeBtn} aria-label="Badilisha mandhari">
          <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
        </button>
        <Link href="/notifications" className={styles.bell}>
          <i className="ri-notification-3-line" />
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </Link>
        <Link href="/profile" title={displayName}>
          <Avatar emoji="🐧" size={28} ring />
        </Link>
      </div>
    </div>
  );
}
