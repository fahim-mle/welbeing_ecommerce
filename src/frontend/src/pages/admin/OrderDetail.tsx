import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchAdminOrder, updateOrderStatus } from '../../api/admin';
import type { OrderResponse } from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';

const statusOptions = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!id) {
      setError('Order not found.');
      setLoading(false);
      return;
    }

    if (!user) {
      setOrder(null);
      setError('Please sign in to view this order.');
      setLoading(false);
      return;
    }

    const orderId = Number(id);
    if (Number.isNaN(orderId)) {
      setError('Invalid order ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchAdminOrder(orderId)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, id]);

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!user || !order) return;
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status.';
      setError(message);
    }
  };

  if (loading) {
    return <div className="p-8">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || 'Order not found.'}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Link to="/admin/orders" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to orders
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <select
            value={order.status}
            onChange={(event) => handleStatusUpdate(event.target.value)}
            className="form-input py-2"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Customer</h2>
            <p className="text-sm text-gray-600">{order.user?.email || order.guestEmail}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Payment Status</h2>
            <p className="text-sm text-gray-600">{order.paymentStatus ?? 'PENDING'}</p>
          </div>
        </div>
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
          <div className="flex justify-between text-sm font-semibold text-gray-900 pt-4 border-t border-gray-100">
            <span>Total</span>
            <span>${Number(order.totalPrice).toFixed(2)}</span>
          </div>
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
    </div>
  );
};
