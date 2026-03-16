import React, { createContext, useMemo, useState } from 'react';

export interface CartUIContextValue {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const CartUIContext = createContext<CartUIContextValue | undefined>(undefined);

export const CartUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const value = useMemo(
    () => ({
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      toggleCart: () => setIsCartOpen((prev) => !prev),
    }),
    [isCartOpen],
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
};
