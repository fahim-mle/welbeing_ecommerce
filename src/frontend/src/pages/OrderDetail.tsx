import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelOrder, fetchOrder, type OrderResponse } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/PageLoader';

const cancellableStatuses = ['PENDING', 'PAID'];

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrder = useCallback(async (orderId: number) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrder(orderId);
      setOrder(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOrder(null);
      setCancelMessage(null);
      setCancelError(null);
      setError('Please sign in to view your order.');
      setLoading(false);
      return;
    }

    const parsedId = Number(id);
    if (!id || Number.isNaN(parsedId)) {
      setError('Invalid order ID.');
      setLoading(false);
      return;
    }

    loadOrder(parsedId);
  }, [id, user, loadOrder]);

  const handleCancel = async () => {
    if (!user || !order) return;
    setCancelMessage(null);
    setCancelError(null);
    setIsCancelling(true);

    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      setCancelMessage('Order cancelled successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to cancel order.';
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Order not found'}</h1>
        <p className="text-gray-600 mb-6">We could not retrieve the order details.</p>
        <Link to="/profile" className="btn-primary rounded-full">
          Back to profile
        </Link>
      </div>
    );
  }

  const paymentStatus = order.paymentStatus ?? 'PENDING';
  const canCancel = cancellableStatuses.includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/profile" className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            Back to profile
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Order Details</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Order #{order.id}</p>
              <p className="text-xs text-gray-400">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {order.status}
              </span>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                {paymentStatus}
              </span>
            </div>
          </div>

          {cancelMessage && <p className="text-sm text-green-600">{cancelMessage}</p>}
          {cancelError && <p className="text-sm text-red-600">{cancelError}</p>}

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-900">Total</p>
            <p className="text-lg font-bold text-gray-900">${Number(order.totalPrice).toFixed(2)}</p>
          </div>

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-b-0">
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

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h2>
              {order.address ? (
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{order.address.fullName}</p>
                  <p>{order.address.streetLine1}</p>
                  {order.address.streetLine2 && <p>{order.address.streetLine2}</p>}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </p>
                  <p>{order.address.country}</p>
                  <p className="text-xs text-gray-500 mt-2">Phone: {order.address.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{order.shippingAddress || 'No address available.'}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Status History</h2>
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
                <p className="text-sm text-gray-500">Current status: {order.status}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
