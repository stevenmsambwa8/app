'use client'
import styles from './FollowBtn.module.css'

export default function FollowBtn({ following, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.btn} ${following ? 'btnGhost' : 'btnAccent'}`}
    >
      <i className={following ? 'ri-check-line' : 'ri-user-add-line'} />
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
