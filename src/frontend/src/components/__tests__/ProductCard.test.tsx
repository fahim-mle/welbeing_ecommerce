import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Product } from '../../api/catalog';
import { ProductCard } from '../ProductCard';

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  price: 29.99,
  stockStatus: 'IN_STOCK',
  stockQuantity: 10,
  isVisible: true,
  categoryId: 1,
  category: { id: 1, name: 'Test Category' },
  images: [{ id: 1, url: 'http://test.com/image.jpg', displayOrder: 0 }],
  tags: [{ id: 1, name: 'Goal', type: 'GOAL' }]
};

describe('ProductCard', () => {
  it('renders product details correctly', () => {
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
  });
});
