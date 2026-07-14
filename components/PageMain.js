'use client'
import { usePathname } from 'next/navigation'

export default function PageMain({ children }) {
  const pathname = usePathname();
  const noTopBar = pathname?.startsWith('/create');

  return <main className={noTopBar ? 'no-topbar' : ''}>{children}</main>;
}
