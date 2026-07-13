'use client'
import Link from 'next/link'
import Avatar from './Avatar'
import { ME, NOTIFS } from '../lib/mockData'
import styles from './TopBar.module.css'

export default function TopBar() {
  const unread = NOTIFS.filter((n) => n.unread).length;
  return (
    <div className={styles.bar}>
      <Link href="/feed" className={styles.logo}>ADVAT</Link>
      <div className={styles.right}>
        <Link href="/notifications" className={styles.bell}>
          <i className="ri-notification-3-line" />
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </Link>
        <Link href="/profile">
          <Avatar emoji={ME.avatar} size={28} />
        </Link>
      </div>
    </div>
  );
}
