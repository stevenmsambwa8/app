'use client'
import styles from './BusinessStats.module.css'

function formatPrice(price) {
  return `TZS ${Number(price).toLocaleString('sw-TZ')}`;
}

export default function BusinessStats({ posts }) {
  const totals = posts.reduce(
    (acc, p) => {
      acc.likes += p.likes || 0;
      acc.comments += p.comments || 0;
      acc.ctaClicks += p.ctaClicks || 0;
      acc.cartAdds += p.cartAdds || 0;
      if (p.price != null) acc.products += 1;
      return acc;
    },
    { likes: 0, comments: 0, ctaClicks: 0, cartAdds: 0, products: 0 }
  );

  const topProduct = posts
    .filter((p) => p.price != null)
    .sort((a, b) => (b.cartAdds || 0) - (a.cartAdds || 0))[0];

  const STATS = [
    { label: 'Kupendwa', value: totals.likes, icon: 'ri-heart-fill' },
    { label: 'Maoni', value: totals.comments, icon: 'ri-chat-3-fill' },
    { label: 'Kubofya Kiungo', value: totals.ctaClicks, icon: 'ri-cursor-line' },
    { label: 'Kikapuni', value: totals.cartAdds, icon: 'ri-shopping-cart-2-fill' },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <i className={s.icon} />
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {totals.products > 0 && (
        <p className={styles.productCount}>
          Una bidhaa <b>{totals.products}</b> zenye bei.
        </p>
      )}

      {topProduct && topProduct.cartAdds > 0 && (
        <div className={styles.topProduct}>
          <span className={styles.topProductLabel}>Bidhaa inayoongoza</span>
          <span className={styles.topProductTitle}>{topProduct.text?.slice(0, 40)}</span>
          <span className={styles.topProductMeta}>
            {formatPrice(topProduct.price)} · {topProduct.cartAdds} kikapuni
          </span>
        </div>
      )}

      {posts.length === 0 && (
        <p className={styles.empty}>Hujachapisha bado — takwimu zitaonekana hapa.</p>
      )}
    </div>
  );
}
