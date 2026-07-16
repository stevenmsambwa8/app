'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../components/AuthProvider'
import { useAuthModal } from '../../components/AuthModalProvider'
import { useNotifications } from '../../components/NotificationsProvider'
import styles from './page.module.css'

const ICONS = {
  like: 'ri-heart-fill',
  follow: 'ri-user-add-fill',
  comment: 'ri-chat-3-fill',
};

function copyFor(n) {
  if (n.type === 'follow') return 'amekufuata';
  if (n.type === 'like') return 'amependa chapisho lako';
  if (n.type === 'comment') return n.commentText ? `ameandika maoni: "${n.commentText}"` : 'ameandika maoni kwenye chapisho lako';
  return '';
}

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'sasa hivi';
  if (mins < 60) return `dakika ${mins}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs}`;
  const days = Math.floor(hrs / 24);
  return `siku ${days}`;
}

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const { notifications, loading, markAllRead } = useNotifications();

  useEffect(() => {
    markAllRead();
    // Only mark read on entry, not on every notifications change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className={styles.wrap} style={{ textAlign: 'center', paddingTop: 48 }}>
        <p>Ingia ili uone arifa zako.</p>
        <button type="button" className="btnAccent" style={{ marginTop: 12 }} onClick={() => openAuth('signin')}>
          Ingia
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.time}>Inapakia arifa…</p>
      </div>
    );
  }

  const groups = [
    ['Leo', notifications.filter((n) => isToday(n.createdAt))],
    ['Awali', notifications.filter((n) => !isToday(n.createdAt))],
  ];

  const hasAny = notifications.length > 0;

  return (
    <div className={styles.wrap}>
      {!hasAny && <p className={styles.time}>Bado huna arifa.</p>}
      {groups.map(([label, list]) =>
        list.length === 0 ? null : (
          <div key={label} className={styles.section}>
            <p className={styles.sectionTitle}>{label}</p>
            <div className={styles.list}>
              {list.map((n) => {
                const row = (
                  <div className={`card ${styles.row}`}>
                    <div className={styles.avatarWrap}>
                      <Avatar emoji={n.actor.avatar} src={n.actor.avatarUrl} size={38} />
                      <div className={styles.iconBadge}>
                        <i className={`${ICONS[n.type]} ${styles[n.type]}`} />
                      </div>
                    </div>
                    <p className={styles.text}>
                      <span className={styles.who}>{n.actor.name}</span>{' '}
                      <span className={styles.what}>{copyFor(n)}</span>
                    </p>
                    <span className={styles.time}>{timeAgo(n.createdAt)}</span>
                  </div>
                );
                return n.postId ? (
                  <Link key={n.id} href={`/post/${n.postId}`} style={{ display: 'block' }}>
                    {row}
                  </Link>
                ) : (
                  <div key={n.id}>{row}</div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
