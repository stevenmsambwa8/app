import Avatar from '../../components/Avatar'
import { NOTIFS, userById } from '../../lib/mockData'
import styles from './page.module.css'

const ICONS = {
  like: 'ri-heart-fill',
  follow: 'ri-user-add-fill',
  comment: 'ri-chat-3-fill',
  flex: 'ri-trophy-fill',
};

export default function NotificationsPage() {
  const groups = [
    ['Today', NOTIFS.filter((n) => n.unread)],
    ['Earlier', NOTIFS.filter((n) => !n.unread)],
  ];

  return (
    <div className={styles.wrap}>
      {groups.map(([label, list]) => (
        <div key={label} className={styles.section}>
          <p className={styles.sectionTitle}>{label}</p>
          <div className={styles.list}>
            {list.map((n) => {
              const user = userById(n.uid);
              return (
                <div key={n.id} className={`card ${styles.row}`}>
                  <div className={styles.avatarWrap}>
                    <Avatar emoji={user.avatar} size={38} />
                    <div className={styles.iconBadge}>
                      <i className={`${ICONS[n.type]} ${styles[n.type]}`} />
                    </div>
                  </div>
                  <p className={styles.text}>
                    <span className={styles.who}>{user.name}</span>{' '}
                    <span className={styles.what}>{n.text}</span>
                  </p>
                  <span className={styles.time}>{n.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
