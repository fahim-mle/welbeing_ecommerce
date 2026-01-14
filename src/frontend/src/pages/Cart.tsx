import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Cart: React.FC = () => {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const shipping = items.length === 0 ? 0 : subtotal >= 50 ? 0 : 8;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Browse the catalog to add wellbeing essentials.</p>
        <Link to="/" className="btn-primary rounded-full">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            Continue shopping
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Clear cart
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[2fr,1fr] gap-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {items.map((item) => {
            const itemPrice = item.variant?.price ?? item.product.price;
            return (
              <div
                key={`${item.product.id}-${item.variant?.id ?? 'base'}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 p-6 last:border-b-0"
              >
                <img
                  src={item.product.images?.[0]?.url || 'https://placehold.co/120x120'}
                  alt={item.product.name}
                  className="w-28 h-28 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{item.product.name}</h2>
                  {item.variant && (
                    <p className="text-sm text-gray-500">{item.variant.sku}</p>
                  )}
                  <p className="text-sm text-gray-500">${Number(itemPrice).toFixed(2)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(
                            item.product.id,
                            Number(event.target.value) || 1,
                            item.variant?.id,
                          )
                        }
                        className="w-16 text-center border border-gray-200 rounded-lg py-2 text-sm"
                      />
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => removeItem(item.product.id, item.variant?.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ${(Number(itemPrice) * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping (Est.)</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (Est.)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link
            to="/checkout"
            className="btn-primary w-full text-center py-3 text-base font-semibold"
          >
            Proceed to Checkout
          </Link>
          <p className="text-xs text-gray-500">
            Estimated totals are calculated before shipping and taxes are finalized.
          </p>
        </aside>
      </main>
    </div>
  );
};
