import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const CartSummary: React.FC = () => {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-start gap-4 border-b border-gray-100 pb-4">
              <img
                src={item.product.images?.[0]?.url || 'https://placehold.co/80x80'}
                alt={item.product.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{item.product.name}</h3>
                <p className="text-xs text-gray-500">${Number(item.product.price).toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline ml-4"
                    onClick={() => removeItem(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                ${(Number(item.product.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-gray-600">Subtotal</span>
        <span className="text-gray-900">${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
