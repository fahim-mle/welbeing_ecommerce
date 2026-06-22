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
      <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">{error || 'Order not found'}</h1>
        <p className="text-text-secondary mb-6">We could not retrieve the order details.</p>
        <Link to="/profile" className="btn-primary rounded-full">
          Back to profile
        </Link>
      </div>
    );
  }

  const paymentStatus = order.paymentStatus ?? 'PENDING';
  const canCancel = cancellableStatuses.includes(order.status);

  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/profile" className="text-sm font-medium text-text-secondary hover:text-primary-600">
            Back to profile
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Order Details</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-text-secondary">Order #{order.id}</p>
              <p className="text-xs text-text-muted">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-surface-alt text-text-primary px-2 py-1 rounded-full">
                {order.status}
              </span>
              <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                {paymentStatus}
              </span>
            </div>
          </div>

          {cancelMessage && <p className="text-sm text-success-600">{cancelMessage}</p>}
          {cancelError && <p className="text-sm text-danger-600">{cancelError}</p>}

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-text-primary">Total</p>
            <p className="text-lg font-bold text-text-primary">${Number(order.totalPrice).toFixed(2)}</p>
          </div>

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-danger-50 text-danger-600 hover:bg-danger-100 disabled:opacity-60"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between border-b border-border-default pb-3 last:border-b-0">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.product.name}</p>
                  {item.productVariant?.sku && (
                    <p className="text-xs text-text-secondary">Variant: {item.productVariant.sku}</p>
                  )}
                  <p className="text-xs text-text-secondary">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3">Delivery Address</h2>
              {order.address ? (
                <div className="text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">{order.address.fullName}</p>
                  <p>{order.address.streetLine1}</p>
                  {order.address.streetLine2 && <p>{order.address.streetLine2}</p>}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </p>
                  <p>{order.address.country}</p>
                  <p className="text-xs text-text-secondary mt-2">Phone: {order.address.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">{order.shippingAddress || 'No address available.'}</p>
              )}
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3">Status History</h2>
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <ul className="space-y-3">
                  {order.statusHistory.map((entry) => (
                    <li key={entry.id} className="text-sm text-text-secondary flex justify-between">
                      <span>
                        {entry.fromStatus} → {entry.toStatus}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">Current status: {order.status}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
