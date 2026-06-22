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
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl flex flex-col">
        <div className="h-16 px-5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text-primary">Cart</h2>
            <span className="text-sm text-text-secondary">({totalItems})</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-surface-alt"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-primary font-medium">Your cart is empty</p>
              <p className="text-sm text-text-secondary mt-1">Add something nice for your wellbeing.</p>
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
                    className="flex gap-3 border border-border-default rounded-xl p-3"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-alt border border-border-default flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{item.product.name}</p>
                          {variantLabel && (
                            <p className="text-xs text-text-secondary truncate">{variantLabel}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-surface-alt text-text-secondary"
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
                            className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:bg-surface-alt"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-text-primary">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:bg-surface-alt"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-primary">{formatMoney(lineTotal)}</p>
                          <p className="text-xs text-text-secondary">{formatMoney(price)} each</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border-default p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Subtotal</span>
            <span className="text-base font-semibold text-text-primary">{formatMoney(subtotal)}</span>
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
              className="w-full text-center py-3 rounded-xl border border-border-default text-text-primary hover:bg-surface-alt"
            >
              View cart
            </Link>
          </div>

          <p className="text-xs text-text-secondary">
            Taxes, shipping, discounts, and accelerated wallets (PayPal / Apple Pay / Google Pay / Amazon Pay) are planned next.
          </p>
        </div>
      </aside>
    </div>
  );
};
