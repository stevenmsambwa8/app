'use client'
import { usePathname } from 'next/navigation'

export default function PageMain({ children }) {
  const pathname = usePathname();
  const noTopBar = pathname?.startsWith('/create') || pathname?.startsWith('/post/') || pathname?.startsWith('/dm') || pathname?.startsWith('/flex') || pathname?.startsWith('/business');
  const noBottomNav = pathname?.startsWith('/post/') || pathname?.startsWith('/dm') || pathname?.startsWith('/create') || pathname?.startsWith('/business');

  const cls = [noTopBar ? 'no-topbar' : '', noBottomNav ? 'no-bottomnav' : ''].filter(Boolean).join(' ');

  return <main className={cls}>{children}</main>;
}
