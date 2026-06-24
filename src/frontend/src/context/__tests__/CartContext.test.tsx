import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '../CartContext';
import { useCart } from '../useCart';
import type { Product } from '../../api/catalog';

const product: Product = {
  id: 1,
  name: 'Magnesium Sleep Support',
  description: 'Sleep support supplement',
  price: 29.5,
  stockQuantity: 12,
  isVisible: true,
  categoryId: 1,
  images: [],
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const CartHarness = () => {
  const { addItem, clearCart, totalItems, subtotal } = useCart();
  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="subtotal">{subtotal}</p>
      <button type="button" onClick={() => addItem(product, 2)}>Add product</button>
      <button type="button" onClick={clearCart}>Clear cart</button>
    </div>
  );
};

const renderCart = () => render(
  <CartProvider>
    <CartHarness />
  </CartProvider>,
);

describe('CartProvider persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads cart items from localStorage', () => {
    localStorage.setItem('welbeing_cart', JSON.stringify([{ product, quantity: 3 }]));

    renderCart();

    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('88.5');
  });

  it('persists cart mutations to localStorage', () => {
    renderCart();

    fireEvent.click(screen.getByText('Add product'));

    const stored = JSON.parse(localStorage.getItem('welbeing_cart') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ quantity: 2, product: { id: 1 } });
  });

  it('falls back to an empty cart when stored data is invalid', () => {
    localStorage.setItem('welbeing_cart', '{broken-json');

    renderCart();

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });

  it('clears persisted cart data', () => {
    localStorage.setItem('welbeing_cart', JSON.stringify([{ product, quantity: 3 }]));

    renderCart();
    fireEvent.click(screen.getByText('Clear cart'));

    expect(JSON.parse(localStorage.getItem('welbeing_cart') || '[]')).toEqual([]);
  });
});
