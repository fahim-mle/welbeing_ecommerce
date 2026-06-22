import React, { createContext, useEffect, useMemo, useState } from 'react';
import { type Product, type ProductVariant } from '../api/catalog';

const CART_STORAGE_KEY = 'welbeing_cart';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

export interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<CartItem>;
  return Boolean(
    candidate.product
      && typeof candidate.product === 'object'
      && typeof candidate.product.id === 'number'
      && typeof candidate.product.name === 'string'
      && typeof candidate.quantity === 'number'
      && Number.isFinite(candidate.quantity)
      && candidate.quantity > 0,
  );
};

const loadStoredCart = (): CartItem[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
};

const persistCart = (items: CartItem[]) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can fail in private browsing or quota-exceeded states.
    // Cart should keep working in memory even if persistence is unavailable.
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadStoredCart);

  useEffect(() => {
    persistCart(items);
  }, [items]);

  const addItem = (product: Product, quantity = 1, variant?: ProductVariant) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.variant?.id === variant?.id,
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.variant?.id === variant?.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity, variant }];
    });
  };

  const removeItem = (productId: number, variantId?: number) => {
    setItems((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) {
          return true;
        }

        // If a variantId is provided, remove only that specific variant line.
        if (variantId !== undefined) {
          return item.variant?.id !== variantId;
        }

        // Otherwise remove all lines for this product.
        return false;
      }),
    );
  };

  const updateQuantity = (productId: number, quantity: number, variantId?: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.variant?.id === variantId
            ? { ...item, quantity }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = item.variant?.price ?? item.product.price;
        return total + Number(price) * item.quantity;
      }, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, totalItems, subtotal, addItem, removeItem, updateQuantity, clearCart }),
    [items, totalItems, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// useCart hook moved to src/context/useCart.ts for react-refresh compatibility
