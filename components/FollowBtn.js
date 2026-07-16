'use client'
import styles from './FollowBtn.module.css'

export default function FollowBtn({ following, onClick, pending, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`${styles.btn} ${small ? styles.small : ''} ${following ? 'btnGhost' : 'btnAccent'}`}
    >
      <i className={pending ? 'ri-loader-4-line' : following ? 'ri-check-line' : 'ri-user-add-line'} />
      {following ? 'Unamfuata' : 'Fuata'}
    </button>
  );
}
