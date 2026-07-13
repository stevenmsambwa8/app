import Avatar from '../../components/Avatar'
import { FLEX_CARDS, LEADERBOARD } from '../../lib/mockData'
import styles from './page.module.css'

const STATS = [
  { label: 'Wins', value: 214 },
  { label: 'Streak', value: 17 },
  { label: 'MVPs', value: 9 },
  { label: 'Rank', value: 'Diamond' },
];

export default function FlexPage() {
  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.hero}`}>
        <div className={styles.heroTitle}>
          <i className="ri-fire-fill" />
          <h2>Your Flex</h2>
        </div>
        <div className={styles.statGrid}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.sectionTitle}>Flex cards</p>
      <div className={styles.cardGrid}>
        {FLEX_CARDS.map((c) => (
          <div key={c.id} className={styles.flexCardOuter}>
            <div className={styles.flexCardInner} style={{ background: c.gradient }}>
              <i className={`${c.icon} ${styles.flexIcon}`} />
              <div className={styles.flexTitle}>{c.title}</div>
              <div className={styles.flexStat}>{c.stat}</div>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.sectionTitle}>Top flexers this week</p>
      <div className={styles.board}>
        {LEADERBOARD.map((u, i) => (
          <div key={u.id} className={`card ${styles.boardRow}`}>
            <span className={`${styles.rank} ${i === 0 ? styles.rankFirst : ''}`}>{i + 1}</span>
            <Avatar emoji={u.avatar} size={32} />
            <span className={styles.boardName}>{u.name}</span>
            <span className={styles.boardScore}>{u.flexScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
