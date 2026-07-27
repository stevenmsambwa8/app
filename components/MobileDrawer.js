'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from './Avatar'
import { useTheme } from './ThemeProvider'
import { useAuthModal } from './AuthModalProvider'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { useNotifications } from './NotificationsProvider'
import styles from './MobileDrawer.module.css'

const CLOSE_MS = 260; // must match the bounceOut animation duration in the CSS

const TABS = [
  { href: '/feed', label: 'Mlisho', icon: 'ri-sparkling-2-line', activeIcon: 'ri-sparkling-2-fill' },
  { href: '/people', label: 'Watu', icon: 'ri-team-line', activeIcon: 'ri-team-fill' },
  { href: '/flex', label: 'Flex', icon: 'ri-fire-line', activeIcon: 'ri-fire-fill' },
  { href: '/cart', label: 'Kikapu', icon: 'ri-shopping-cart-2-line', activeIcon: 'ri-shopping-cart-2-fill' },
  { href: '/dm', label: 'Ujumbe', icon: 'ri-chat-3-line', activeIcon: 'ri-chat-3-fill' },
  { href: '/profile', label: 'Wasifu', icon: 'ri-user-line', activeIcon: 'ri-user-fill' },
];

export default function MobileDrawer({ open, onClose }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { openAuth } = useAuthModal();
  const { user, profile, signOut } = useAuth();
  const { totalCount: cartCount } = useCart();
  const { unreadCount } = useNotifications();
  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Wewe';
  const displayHandle = user ? `@${displayName}` : '@wewe';
  const avatarEmoji = profile?.avatar || '🐧';
  const avatarUrl = profile?.avatar_url || null;

  // Keeps the drawer mounted for CLOSE_MS after `open` goes false so the
  // bounce-out animation gets to play instead of the drawer just vanishing.
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      return undefined;
    }
    if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, CLOSE_MS);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ''}`}
      onClick={onClose}
    >
      <aside
        className={`${styles.drawer} ${closing ? styles.drawerClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <Image
            src={theme === 'dark' ? '/advat-black.png' : '/advat-white.png'}
            alt="Advat"
            width={671}
            height={315}
            className={styles.logoImg}
          />
          <button type="button" className={styles.close} onClick={onClose} aria-label="Funga menyu">
            <i className="ri-close-line" />
          </button>
        </div>

        <Link href="/profile" className={styles.profileRow} onClick={onClose}>
          <Avatar emoji={avatarEmoji} src={avatarUrl} alt={displayName} size={40} ring />
          <div className={styles.profileText}>
            <span className={styles.profileName}>{displayName}</span>
            <span className={styles.profileHandle}>{displayHandle}</span>
          </div>
        </Link>

        <Link href="/create" className={`btnAccent ${styles.createBtn}`} onClick={onClose}>
          <i className="ri-add-line" />
          <span>Unda Chapisho</span>
        </Link>

        <nav className={styles.nav}>
          {TABS.map((t) => {
            const isActive = pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={onClose}
              >
                <i className={isActive ? t.activeIcon : t.icon} />
                <span>{t.label}{t.href === '/cart' && cartCount > 0 ? ` · ${cartCount}` : ''}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.footerBtn}
            onClick={() => {
              toggleTheme();
            }}
          >
            <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
            <span>{theme === 'dark' ? 'Mandhari Nyepesi' : 'Mandhari ya Giza'}</span>
          </button>
          <Link href="/notifications" className={styles.footerBtn} onClick={onClose}>
            <i className="ri-notification-3-line" />
            <span>Arifa{unreadCount > 0 ? ` · ${unreadCount}` : ''}</span>
          </Link>
          {user ? (
            <button
              type="button"
              className={`btnGhost ${styles.authBtn}`}
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              <i className="ri-logout-box-line" />
              <span>Toka</span>
            </button>
          ) : (
            <button
              type="button"
              className={`btnAccent ${styles.authBtn}`}
              onClick={() => {
                openAuth('signin');
                onClose();
              }}
            >
              <i className="ri-login-box-line" />
              <span>Ingia / Jisajili</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
