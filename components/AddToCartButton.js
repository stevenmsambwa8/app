'use client'
import { useState } from 'react'
import { useCart } from './CartProvider'
import { usePosts } from './PostsProvider'
import styles from './AddToCartButton.module.css'

function formatPrice(price) {
  return `TZS ${Number(price).toLocaleString('sw-TZ')}`;
}

export default function AddToCartButton({ post }) {
  const { addItem } = useCart();
  const { trackCartAdd } = usePosts();
  const [added, setAdded] = useState(false);

  if (post.price == null) return null;

  function handleClick() {
    addItem({
      postId: post.id,
      uid: post.uid,
      businessName: post.author?.name || 'Muuzaji',
      whatsapp: post.author?.whatsapp || null,
      title: post.text?.slice(0, 60) || 'Bidhaa',
      price: post.price,
      image: post.images?.[0] || null,
    });
    trackCartAdd(post.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${added ? styles.added : ''}`}
      onClick={handleClick}
    >
      <i className={added ? 'ri-check-line' : 'ri-shopping-cart-2-line'} />
      <span>{added ? 'Imeongezwa' : formatPrice(post.price)}</span>
    </button>
  );
}
