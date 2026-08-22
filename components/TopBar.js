'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Avatar from './Avatar'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { useNotifications } from './NotificationsProvider'
import { useCart } from './CartProvider'
import MobileDrawer from './MobileDrawer'
import styles from './TopBar.module.css'

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const { totalCount: cartCount } = useCart()
  const { theme } = useTheme()
  const { user, profile } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchDebounceRef = useRef(null)

  // The bar is the single source of truth for the search query — it drives
  // /search via the ?q= param instead of that page having its own separate
  // input. TopBar lives in the root layout for every route, so this reads
  // the URL directly (window.location) on pathname change rather than via
  // next/navigation's useSearchParams, which would force every route in the
  // app into a Suspense boundary just for this one bar.
  useEffect(() => {
    if (pathname === '/search' && typeof window !== 'undefined') {
      setSearchValue(new URLSearchParams(window.location.search).get('q') || '')
    } else {
      setSearchValue('')
    }
  }, [pathname])

  if (
    pathname?.startsWith('/create') ||
    pathname?.startsWith('/post/') ||
    pathname?.startsWith('/dm') ||
    pathname?.startsWith('/flex') ||
    pathname?.startsWith('/business')
  )
    return null

  const displayName =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'Wewe'

  const avatarEmoji = profile?.avatar || '🐧'
  const avatarUrl = profile?.avatar_url || null

  function pushSearch(value) {
    const target = value.trim() ? `/search?q=${encodeURIComponent(value)}` : '/search'
    router.replace(target)
  }

  function handleSearchChange(e) {
    const value = e.target.value
    setSearchValue(value)
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => pushSearch(value), 300)
  }

  function handleSearchFocus() {
    if (pathname !== '/search') router.push(searchValue.trim() ? `/search?q=${encodeURIComponent(searchValue)}` : '/search')
  }

  function clearSearch() {
    setSearchValue('')
    clearTimeout(searchDebounceRef.current)
    if (pathname === '/search') router.replace('/search')
  }

  return (
    <>
      <header className={styles.bar}>
        <div className={styles.left}>
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
        </div>

        <div className={styles.searchBar}>
          <i className="ri-search-line" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder="Tafuta watu, lebo, au bidhaa..."
            aria-label="Tafuta"
          />
          {searchValue && (
            <button type="button" className={styles.searchClear} onClick={clearSearch} aria-label="Futa utafutaji">
              <i className="ri-close-line" />
            </button>
          )}
        </div>

        <div className={styles.right}>
          <Link href="/cart" className={styles.bell} aria-label="Kikapu">
            <i className="ri-shopping-cart-2-line" />
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </Link>

          <Link href="/notifications" className={styles.bell}>
            <i className="ri-notification-3-line" />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </Link>

          <Link href="/profile" title={displayName}>
            <Avatar
              emoji={avatarEmoji}
              src={avatarUrl}
              alt={displayName}
              size={28}
              ring
            />
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            className={styles.menuBtn}
            aria-label="Fungua menyu"
          >
            <i className="ri-menu-3-line" />
          </button>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}