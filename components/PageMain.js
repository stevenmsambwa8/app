'use client'
import { usePathname } from 'next/navigation'

export default function PageMain({ children }) {
  const pathname = usePathname();
  const noTopBar = pathname?.startsWith('/create') || pathname?.startsWith('/post/');
  const noBottomNav = pathname?.startsWith('/post/');

  const cls = [noTopBar ? 'no-topbar' : '', noBottomNav ? 'no-bottomnav' : ''].filter(Boolean).join(' ');

  return <main className={cls}>{children}</main>;
}
