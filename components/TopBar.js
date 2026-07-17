'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from './Avatar'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { useNotifications } from './NotificationsProvider'
import MobileDrawer from './MobileDrawer'
import styles from './TopBar.module.css'

export default function TopBar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname?.startsWith('/create') || pathname?.startsWith('/post/') || pathname?.startsWith('/dm')) return null;

  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Wewe';
  const avatarEmoji = profile?.avatar || '🐧';
  const avatarUrl = profile?.avatar_url || null;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Link href="/create" className={styles.addBtn} aria-label="Chapisho jipya">
          <i className="ri-add-line" />
        </Link>
      </div>

      <Link href="/feed" className={styles.logo}>
        <Image
          src={theme === 'dark' ? '/advat-black.png' : '/advat-white.png'}
          alt="Advat"
          width={100}
          height={40}
          priority
          className={styles.logoImg}
        />
      </Link>

      <div className={styles.right}>
        <Link href="/notifications" className={styles.bell}>
          <i className="ri-notification-3-line" />
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </Link>
        <Link href="/profile" title={displayName}>
          <Avatar emoji={avatarEmoji} src={avatarUrl} alt={displayName} size={28} ring />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className={styles.menuBtn}
          aria-label="Fungua menyu"
        >
          <i className="ri-menu-line" />
        </button>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
