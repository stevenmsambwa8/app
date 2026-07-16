'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from './Avatar'
import { useAuth } from './AuthProvider'
import { useFollow } from './FollowProvider'
import styles from './FollowListModal.module.css'

// title: 'Wafuasi' (followers) or 'Anaowafuata' (following)
export default function FollowListModal({ uid, mode, onClose, onNavigate }) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, pending, fetchFollowers, fetchFollowing } = useFollow();
  const [list, setList] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    setList(null);
    const loader = mode === 'followers' ? fetchFollowers : fetchFollowing;
    loader(uid).then((rows) => {
      if (!cancelled) setList(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, mode, fetchFollowers, fetchFollowing]);

  const title = mode === 'followers' ? 'Wafuasi' : 'Anaowafuata';

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose} aria-label="Funga">
            <i className="ri-close-line" />
          </button>
        </div>
        <div className={styles.list}>
          {list === null ? (
            <p className={styles.empty}>Inapakia…</p>
          ) : list.length === 0 ? (
            <p className={styles.empty}>
              {mode === 'followers' ? 'Hakuna wafuasi bado.' : 'Hajamfuata mtu bado.'}
            </p>
          ) : (
            list.map((p) => {
              const isMe = user && p.id === user.id;
              return (
                <div key={p.id} className={styles.row}>
                  <Link href={isMe ? '/profile' : `/u/${p.id}`} className={styles.who} onClick={onNavigate}>
                    <Avatar emoji={p.avatar} src={p.avatarUrl} size={40} />
                    <div>
                      <div className={styles.name}>{p.name}</div>
                      <div className={styles.handle}>{p.handle}</div>
                    </div>
                  </Link>
                  {!isMe && user && (
                    <button
                      type="button"
                      className={styles.followWord}
                      disabled={!!pending[p.id]}
                      onClick={() => toggleFollow(p.id)}
                    >
                      {isFollowing(p.id) ? 'Unamfuata' : 'Fuata'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
