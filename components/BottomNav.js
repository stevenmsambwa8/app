'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const TABS = [
  { href: '/feed', label: 'Mlisho', icon: 'ri-sparkling-2-line', activeIcon: 'ri-sparkling-2-fill' },
  { href: '/people', label: 'Watu', icon: 'ri-team-line', activeIcon: 'ri-team-fill' },
  { href: '/flex', label: 'Flex', icon: 'ri-fire-line', activeIcon: 'ri-fire-fill' },
  { href: '/dm', label: 'Ujumbe', icon: 'ri-chat-3-line', activeIcon: 'ri-chat-3-fill' },
  { href: '/profile', label: 'Wasifu', icon: 'ri-user-line', activeIcon: 'ri-user-fill' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
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
            <span className={styles.label}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
