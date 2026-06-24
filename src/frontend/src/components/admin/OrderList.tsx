import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOrders, updateOrderStatus } from '../../api/admin';
import type { OrderResponse } from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../Spinner';

const statusOptions = ['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setHasNextPage(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchAdminOrders(page, 10)
      .then((result) => {
        setOrders(result.data);
        setHasNextPage(result.hasNextPage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, page]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!user) return;
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)));
    } catch {
      alert('Failed to update status');
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success-100 text-success-700';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-primary-100 text-primary-800';
      case 'CANCELLED':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <div className="text-danger-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-secondary">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="form-input py-2"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-border-default rounded-lg text-text-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-text-secondary">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNextPage}
            className="px-3 py-1 text-sm border border-border-default rounded-lg text-text-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-surface shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-border-default">
          {filteredOrders.map((order) => (
            <li key={order.id} className="p-4 hover:bg-surface-alt">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-primary-600">Order #{order.id}</h3>
                  <p className="text-sm text-text-secondary">{order.guestEmail || 'Registered User'}</p>
                  <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${Number(order.totalPrice).toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">{order.items.length} items</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-text-primary max-w-md truncate">
                  {order.shippingAddress || order.address?.streetLine1 || 'No address on file'}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 cursor-pointer ${getStatusColor(order.status)}`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-900"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
