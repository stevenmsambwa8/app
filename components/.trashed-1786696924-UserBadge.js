import { BADGE_META } from '../lib/mockData'
import styles from './UserBadge.module.css'

export default function UserBadge({ badge }) {
  if (!badge || !BADGE_META[badge]) return null;
  const meta = BADGE_META[badge];
  return (
    <span className={styles.badge}>
      <i className={meta.icon} />
      {meta.label}
    </span>
  );
}
