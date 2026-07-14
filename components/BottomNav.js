'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const LEFT_TABS = [
  { href: '/feed', label: 'Mlisho', icon: 'ri-sparkling-2-line', activeIcon: 'ri-sparkling-2-fill' },
  { href: '/people', label: 'Watu', icon: 'ri-team-line', activeIcon: 'ri-team-fill' },
];

const RIGHT_TABS = [
  { href: '/flex', label: 'Flex', icon: 'ri-fire-line', activeIcon: 'ri-fire-fill' },
  { href: '/dm', label: 'Ujumbe', icon: 'ri-chat-3-line', activeIcon: 'ri-chat-3-fill' },
];

function NavItem({ t, pathname }) {
  const isActive = pathname?.startsWith(t.href);
  return (
    <Link
      href={t.href}
      className={`${styles.item} ${isActive ? styles.active : ''}`}
    >
      <i className={isActive ? t.activeIcon : t.icon} />
      <span className={styles.label}>{t.label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {LEFT_TABS.map((t) => (
        <NavItem key={t.href} t={t} pathname={pathname} />
      ))}
      <Link href="/create" className={styles.createBtn} aria-label="Unda chapisho">
        <i className="ri-add-line" />
      </Link>
      {RIGHT_TABS.map((t) => (
        <NavItem key={t.href} t={t} pathname={pathname} />
      ))}
    </nav>
  );
}
