import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useCartUI } from '../../hooks/useCartUI';

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart } = useCartUI();
  const { items, subtotal, totalItems, updateQuantity, removeItem } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-700" aria-hidden="true" />
            <h2 className="text-base font-semibold text-gray-900">Cart</h2>
            <span className="text-sm text-gray-500">({totalItems})</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Add something nice for your wellbeing.</p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 btn-primary rounded-full"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const imageUrl = item.product.images?.[0]?.url;
                const price = Number(item.variant?.price ?? item.product.price);
                const lineTotal = price * item.quantity;
                const variantLabel = item.variant
                  ? Object.entries(item.variant.optionValues ?? {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' / ') || item.variant.sku
                  : null;

                return (
                  <li
                    key={`${item.product.id}:${item.variant?.id ?? 'base'}`}
                    className="flex gap-3 border border-gray-100 rounded-xl p-3"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                          {variantLabel && (
                            <p className="text-xs text-gray-500 truncate">{variantLabel}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatMoney(lineTotal)}</p>
                          <p className="text-xs text-gray-500">{formatMoney(price)} each</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-base font-semibold text-gray-900">{formatMoney(subtotal)}</span>
          </div>

          {/* Placeholder for future: coupons / shipping / wallet buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center py-3"
            >
              Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeCart}
              className="w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              View cart
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Taxes, shipping, discounts, and accelerated wallets (PayPal / Apple Pay / Google Pay / Amazon Pay) are planned next.
          </p>
        </div>
      </aside>
    </div>
  );
};
