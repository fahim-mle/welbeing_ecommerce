import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../../api/catalog';
import { ProductCard } from '../ProductCard';

// Mock useCart
const mockAddItem = vi.fn();
vi.mock('../../context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}));

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  price: 29.99,
  originalPrice: 39.99,
  stockQuantity: 10,
  isVisible: true,
  categoryId: 1,
  category: { id: 1, name: 'Test Category' },
  images: [{ id: 1, url: 'http://test.com/image.jpg', displayOrder: 0 }],
  tags: [{ id: 1, name: 'Goal', type: 'GOAL' }],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('ProductCard', () => {
  it('renders product details and badges correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://test.com/image.jpg');
    
    // Check for discount badge (25% off)
    expect(screen.getByText('-25%')).toBeInTheDocument();
    // Check for original price strike-through
    expect(screen.getByText('$39.99')).toHaveClass('line-through');
  });

  it('calls addItem when quick add button is clicked', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const button = screen.getByLabelText('Add to cart');
    fireEvent.click(button);
    expect(mockAddItem).toHaveBeenCalledWith(mockProduct);
  });
});
