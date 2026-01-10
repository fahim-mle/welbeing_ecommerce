import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { type OrderResponse } from '../api/orders';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const order = (location.state as { order?: OrderResponse } | null)?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No order found</h1>
        <p className="text-gray-600 mb-6">Your confirmation details are unavailable.</p>
        <Link
           to="/"
           className="btn-primary rounded-full"
         >
           Back to store
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            Back to store
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Order Confirmed</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Thank you for your purchase</p>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
            <p className="text-sm text-gray-500">Confirmation sent to {order.guestEmail}</p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-sm font-semibold text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">${Number(order.totalPrice).toFixed(2)}</span>
          </div>

          <div className="text-sm text-gray-500">Shipping to: {order.shippingAddress}</div>
        </div>
      </main>
    </div>
  );
};
