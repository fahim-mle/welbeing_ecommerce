import React from 'react';
import { Link } from 'react-router-dom';
import { type Product } from '../api/catalog';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage = product.images?.[0]?.url || 'https://placehold.co/600x400?text=No+Image';

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col overflow-hidden transform hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          />
          {product.stockStatus !== 'IN_STOCK' && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              Out of Stock
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <div className="mb-2">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
                    {product.category?.name}
                </p>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                </h3>
            </div>

          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow font-light leading-relaxed">
            {product.description}
          </p>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
             <span className="text-xl font-bold text-gray-900">
                ${product.price}
             </span>
             <span className="text-sm font-medium text-indigo-600 group-hover:underline flex items-center gap-1">
                 View Details &rarr;
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
