import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';

export const CartSummary: React.FC = () => {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Your Cart</h2>
        <Link to="/" className="text-sm text-primary-600 hover:underline">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-text-secondary text-sm">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const itemPrice = item.variant?.price ?? item.product.price;
            return (
              <div
                key={`${item.product.id}-${item.variant?.id ?? 'base'}`}
                className="flex items-start gap-4 border-b border-border-default pb-4"
              >
                <img
                  src={item.product.images?.[0]?.url || 'https://placehold.co/80x80'}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">{item.product.name}</h3>
                  {item.variant && (
                    <p className="text-xs text-text-secondary">{item.variant.sku}</p>
                  )}
                  <p className="text-xs text-text-secondary">${Number(itemPrice).toFixed(2)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full border border-border-default text-text-secondary hover:bg-surface-alt"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                    >
                      -
                    </button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full border border-border-default text-text-secondary hover:bg-surface-alt"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="text-xs text-danger-500 hover:underline ml-4"
                      onClick={() => removeItem(item.product.id, item.variant?.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  ${(Number(itemPrice) * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-text-secondary">Subtotal</span>
        <span className="text-text-primary">${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
