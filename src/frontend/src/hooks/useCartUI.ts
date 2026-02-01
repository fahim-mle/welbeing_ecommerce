import { useContext } from 'react';
import { CartUIContext } from '../context/CartUIContext';

export const useCartUI = () => {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error('useCartUI must be used within a CartUIProvider');
  }
  return context;
};
