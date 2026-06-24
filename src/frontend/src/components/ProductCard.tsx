import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { type Product } from '../api/catalog';
import { useCart } from '../context/useCart';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const primaryImage = product.images?.[0]?.url || 'https://placehold.co/600x400?text=No+Image';

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <div className="bg-surface rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border-default h-full flex flex-col overflow-hidden transform hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          />
          {product.stockQuantity <= 0 && (
            <div className="absolute top-2 right-2 bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              Out of Stock
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-success-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              -{discount}%
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <div className="mb-2">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
              {product.category?.name}
            </p>
            <h3 className="text-lg font-bold text-text-primary line-clamp-1 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </div>

          <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-grow font-light leading-relaxed">
            {product.description}
          </p>

          <div className="pt-4 border-t border-border-default flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text-primary">
                ${product.price}
              </span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <span className="text-xs text-text-muted line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            {product.stockQuantity > 0 ? (
              <button
                onClick={handleAddToCart}
                className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
                aria-label="Add to cart"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
            ) : (
              <span className="text-sm font-medium text-text-muted">Unavailable</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
