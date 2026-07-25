import { BADGE_META } from '../lib/mockData'
import styles from './UserBadge.module.css'

export default function UserBadge({ badge, iconOnly }) {
  if (!badge || !BADGE_META[badge]) return null;
  const meta = BADGE_META[badge];
  if (iconOnly) {
    return (
      <span className={`${styles.badge} ${styles.iconOnly}`} title={meta.label} aria-label={meta.label}>
        <i className={meta.icon} />
      </span>
    );
  }
  return (
    <span className={styles.badge}>
      <i className={meta.icon} />
      {meta.label}
    </span>
  );
}
