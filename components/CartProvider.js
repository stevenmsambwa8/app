'use client'
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'

// The cart lives entirely on this device (localStorage) — there's no order
// backend yet. Checkout is a WhatsApp message to the business, grouped per
// business since a single cart can hold items from several sellers.
const STORAGE_KEY = 'advat:cart';

const CartContext = createContext({
  items: [],
  totalCount: 0,
  groupedByBusiness: [],
  addItem: () => {},
  removeItem: () => {},
  setQty: () => {},
  clearBusiness: () => {},
  clearAll: () => {},
});

function loadCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // best-effort only
  }
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.postId === item.postId);
      if (existing) {
        return prev.map((it) =>
          it.postId === item.postId ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((postId) => {
    setItems((prev) => prev.filter((it) => it.postId !== postId));
  }, []);

  const setQty = useCallback((postId, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((it) => it.postId !== postId);
      return prev.map((it) => (it.postId === postId ? { ...it, qty } : it));
    });
  }, []);

  const clearBusiness = useCallback((uid) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const totalCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  const groupedByBusiness = useMemo(() => {
    const groups = {};
    items.forEach((it) => {
      if (!groups[it.uid]) {
        groups[it.uid] = {
          uid: it.uid,
          businessName: it.businessName,
          whatsapp: it.whatsapp,
          items: [],
          subtotal: 0,
        };
      }
      groups[it.uid].items.push(it);
      groups[it.uid].subtotal += (it.price || 0) * it.qty;
    });
    return Object.values(groups);
  }, [items]);

  const value = useMemo(
    () => ({ items, totalCount, groupedByBusiness, addItem, removeItem, setQty, clearBusiness, clearAll }),
    [items, totalCount, groupedByBusiness, addItem, removeItem, setQty, clearBusiness, clearAll]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
