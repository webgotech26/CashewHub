import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cashew_cart';

/**
 * CartProvider — wraps the customer layout.
 * Cart is persisted to localStorage so it survives page refreshes.
 *
 * Exposes:
 *   cartItems      — array of { id, name, price, qty, ... }
 *   addToCart(product)
 *   removeFromCart(productId)
 *   updateQty(productId, delta)   — delta = +1 or -1; removes item at qty 0
 *   clearCart()
 *   cartTotal      — sum of (effective price × qty)
 *   cartCount      — total number of items (sum of qtys)
 */
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    // Rehydrate from localStorage on first render
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // localStorage might be unavailable in some browsers
    }
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCartItems(prev =>
      prev
        .map(i => i.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Effective price = price (offer_price column removed from DB)
  const effectivePrice = (item) => Number(item.price);

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + effectivePrice(i) * i.qty, 0
  );

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      cartTotal,
      cartCount,
      effectivePrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
