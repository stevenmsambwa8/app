'use client'
import styles from './FollowBtn.module.css'

export default function FollowBtn({ following, onClick, pending, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`${styles.btn} ${small ? styles.small : ''} ${following ? styles.following : 'btnAccent'}`}
    >
      {pending ? 'Inasubiri...' : following ? 'Unamfuata' : 'Fuata'}
    </button>
  );
}
