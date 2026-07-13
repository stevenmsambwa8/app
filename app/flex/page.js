import Avatar from '../../components/Avatar'
import { FLEX_CARDS, LEADERBOARD } from '../../lib/mockData'
import styles from './page.module.css'

const STATS = [
  { label: 'Machapisho', value: 214 },
  { label: 'Mfululizo', value: 17 },
  { label: 'Umeangaziwa', value: 9 },
  { label: 'Wafuasi', value: '1.2k' },
];

export default function FlexPage() {
  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.hero}`}>
        <div className={styles.heroTitle}>
          <i className="ri-fire-fill" />
          <h2>Flex Yako</h2>
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

      <p className={styles.sectionTitle}>Kadi za Flex</p>
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

      <p className={styles.sectionTitle}>Waflex Bora Wiki Hii</p>
      <div className={styles.board}>
        {LEADERBOARD.map((u, i) => (
          <div key={u.id} className={`card ${styles.boardRow}`}>
            <span className={`${styles.rank} ${i === 0 ? styles.rankFirst : ''}`}>{i + 1}</span>
            <Avatar emoji={u.avatar} size={32} ring={i === 0} />
            <span className={styles.boardName}>{u.name}</span>
            <span className={styles.boardScore}>{u.flexScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
