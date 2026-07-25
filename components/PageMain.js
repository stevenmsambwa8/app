'use client'
import { usePathname } from 'next/navigation'

export default function PageMain({ children }) {
  const pathname = usePathname();
  const noTopBar = pathname?.startsWith('/create') || pathname?.startsWith('/post/') || pathname?.startsWith('/dm');
  const noBottomNav = pathname?.startsWith('/post/') || pathname?.startsWith('/dm') || pathname?.startsWith('/create');
  const wide = pathname?.startsWith('/post/');

  const cls = [noTopBar ? 'no-topbar' : '', noBottomNav ? 'no-bottomnav' : '', wide ? 'wide-page' : '']
    .filter(Boolean)
    .join(' ');

  return <main className={cls}>{children}</main>;
}
