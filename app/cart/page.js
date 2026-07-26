'use client'
import Link from 'next/link'
import { useCart } from '../../components/CartProvider'
import styles from './page.module.css'

function formatPrice(price) {
  return `TZS ${Number(price).toLocaleString('sw-TZ')}`;
}

function buildOrderMessage(group) {
  const lines = group.items.map(
    (it) => `• ${it.title} x${it.qty} — ${formatPrice(it.price * it.qty)}`
  );
  lines.push('', `Jumla: ${formatPrice(group.subtotal)}`);
  return `Habari, ningependa kuagiza:\n${lines.join('\n')}`;
}

export default function CartPage() {
  const { groupedByBusiness, setQty, removeItem, totalCount } = useCart();
  const grandTotal = groupedByBusiness.reduce((sum, g) => sum + g.subtotal, 0);

  if (totalCount === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <i className="ri-shopping-cart-2-line" />
          <p>Kikapu chako ni tupu.</p>
          <Link href="/feed" className="btnAccent">
            Rudi Mlisho
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Kikapu Changu</h2>

      {groupedByBusiness.map((group) => (
        <div key={group.uid} className={`card ${styles.groupCard}`}>
          <div className={styles.groupHead}>
            <i className="ri-store-2-fill" />
            <span>{group.businessName}</span>
          </div>

          {group.items.map((it) => (
            <div key={it.postId} className={styles.item}>
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" className={styles.itemImg} />
              ) : (
                <div className={styles.itemImgFallback}>
                  <i className="ri-price-tag-3-line" />
                </div>
              )}
              <div className={styles.itemInfo}>
                <p className={styles.itemTitle}>{it.title}</p>
                <p className={styles.itemPrice}>{formatPrice(it.price)}</p>
              </div>
              <div className={styles.qtyRow}>
                <button type="button" onClick={() => setQty(it.postId, it.qty - 1)} aria-label="Punguza">
                  <i className="ri-subtract-line" />
                </button>
                <span>{it.qty}</span>
                <button type="button" onClick={() => setQty(it.postId, it.qty + 1)} aria-label="Ongeza">
                  <i className="ri-add-line" />
                </button>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeItem(it.postId)}
                aria-label="Ondoa"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ))}

          <div className={styles.groupFoot}>
            <span className={styles.subtotal}>Jumla: {formatPrice(group.subtotal)}</span>
            {group.whatsapp ? (
              <a
                href={`https://wa.me/${group.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                  buildOrderMessage(group)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`btnAccent ${styles.orderBtn}`}
              >
                <i className="ri-whatsapp-fill" />
                Agiza kupitia WhatsApp
              </a>
            ) : (
              <span className={styles.noWhatsapp}>Muuzaji hajaweka namba ya WhatsApp</span>
            )}
          </div>
        </div>
      ))}

      <div className={styles.grandTotal}>
        <span>Jumla Kuu</span>
        <b>{formatPrice(grandTotal)}</b>
      </div>
    </div>
  );
}
