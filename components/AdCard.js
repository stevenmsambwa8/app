import styles from './AdCard.module.css'

export default function AdCard({ ad }) {
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.media} style={{ background: ad.gradient }}>
        <span className={styles.brand}>{ad.brand}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.tag}>
          <i className="ri-sparkling-2-fill" />
          <span className={styles.tagText}>Imedhaminiwa</span>
        </div>
        <p className={styles.headline}>{ad.headline}</p>
        <p className={styles.copy}>{ad.body}</p>
        <a href={ad.url} target="_blank" rel="noopener noreferrer" className={`btnAccent ${styles.cta}`}>
          {ad.cta}
        </a>
      </div>
    </div>
  );
}
