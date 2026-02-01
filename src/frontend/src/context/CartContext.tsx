import React, { createContext, useMemo, useState } from 'react';
import { type Product, type ProductVariant } from '../api/catalog';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

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
