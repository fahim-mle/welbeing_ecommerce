import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useCartUI } from '../../hooks/useCartUI';

export const FloatingCartButton: React.FC = () => {
  const { totalItems } = useCart();
  const { openCart } = useCartUI();

  return (
    <button
      type="button"
      onClick={openCart}
      className="fixed bottom-6 right-6 z-[55] rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-300 px-4 py-3 flex items-center gap-2 hover:bg-indigo-700"
      aria-label={`Open cart (${totalItems} items)`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-semibold">{totalItems}</span>
    </button>
  );
};
