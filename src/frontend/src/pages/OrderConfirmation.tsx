import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchOrder, type OrderResponse } from '../api/orders';
import { useAuth } from '../hooks/useAuth';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useAuth();
  const stateOrder = (location.state as { order?: OrderResponse } | null)?.order;

  const [order, setOrder] = useState<OrderResponse | null>(stateOrder ?? null);
  const [loading, setLoading] = useState(Boolean(orderId && !stateOrder));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || stateOrder) {
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Please sign in to view this order.');
      setLoading(false);
      return;
    }

    const parsedId = Number(orderId);
    if (Number.isNaN(parsedId)) {
      setError('Invalid order ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchOrder(parsedId, token)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load order details. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [orderId, stateOrder, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-indigo-600">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'No order found'}</h1>
        <p className="text-gray-600 mb-6">Your confirmation details are unavailable.</p>
        <Link to="/" className="btn-primary rounded-full">
          Back to store
        </Link>
      </div>
    );
  }

  const contactEmail = order.user?.email || order.guestEmail || 'Not available';
  const paymentStatus = order.paymentStatus ?? 'PENDING';

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Thank you for your purchase</p>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
            <p className="text-sm text-gray-500">Confirmation sent to {contactEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <div className="border-t border-gray-100 pt-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                      {item.productVariant?.sku && (
                        <p className="text-xs text-gray-500">Variant: {item.productVariant.sku}</p>
                      )}
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-lg font-bold text-gray-900">${Number(order.totalPrice).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Address</h3>
                {order.address ? (
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900">{order.address.fullName}</p>
                    <p>{order.address.streetLine1}</p>
                    {order.address.streetLine2 && <p>{order.address.streetLine2}</p>}
                    <p>
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p>{order.address.country}</p>
                    <p className="mt-2 text-xs text-gray-500">Phone: {order.address.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{order.shippingAddress || 'No address details available.'}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Status</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : paymentStatus === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Status History</h3>
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {order.statusHistory.map((entry) => (
                      <li key={entry.id} className="text-sm text-gray-600 flex justify-between">
                        <span>
                          {entry.fromStatus} → {entry.toStatus}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">
                    Current status: <span className="font-medium text-gray-700">{order.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
