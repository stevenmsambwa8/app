'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from './Avatar'
import { useTheme } from './ThemeProvider'
import { useAuthModal } from './AuthModalProvider'
import { ME, NOTIFS } from '../lib/mockData'
import styles from './Sidebar.module.css'

const TABS = [
  { href: '/feed', label: 'Mlisho', icon: 'ri-sparkling-2-line', activeIcon: 'ri-sparkling-2-fill' },
  { href: '/people', label: 'Watu', icon: 'ri-team-line', activeIcon: 'ri-team-fill' },
  { href: '/flex', label: 'Flex', icon: 'ri-fire-line', activeIcon: 'ri-fire-fill' },
  { href: '/dm', label: 'Ujumbe', icon: 'ri-chat-3-line', activeIcon: 'ri-chat-3-fill' },
  { href: '/profile', label: 'Wasifu', icon: 'ri-user-line', activeIcon: 'ri-user-fill' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { openAuth } = useAuthModal();
  const unread = NOTIFS.filter((n) => n.unread).length;

  return (
    <aside className={styles.sidebar}>
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

      <Link href="/create" className={`btnAccent ${styles.createBtn}`}>
        <i className="ri-add-line" />
        <span>Unda</span>
      </Link>

      <nav className={styles.nav}>
        {TABS.map((t) => {
          const isActive = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
            >
              <i className={isActive ? t.activeIcon : t.icon} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button onClick={toggleTheme} className={styles.footerBtn}>
          <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
          <span>{theme === 'dark' ? 'Mandhari Nyepesi' : 'Mandhari ya Giza'}</span>
        </button>
        <Link href="/notifications" className={styles.footerBtn}>
          <i className="ri-notification-3-line" />
          <span>Arifa{unread > 0 ? ` · ${unread}` : ''}</span>
        </Link>
        <button onClick={() => openAuth('signin')} className={`btnAccent ${styles.authBtn}`}>
          <i className="ri-login-box-line" />
          <span>Ingia / Jisajili</span>
        </button>
        <Link href="/profile" className={styles.profileRow}>
          <Avatar emoji={ME.avatar} size={32} ring />
          <div className={styles.profileText}>
            <span className={styles.profileName}>{ME.name}</span>
            <span className={styles.profileHandle}>{ME.handle}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
