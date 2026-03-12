import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOrders, updateOrderStatus } from '../../api/admin';
import type { OrderResponse } from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';

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
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Status</label>
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
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNextPage}
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {filteredOrders.map((order) => (
            <li key={order.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-indigo-600">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">{order.guestEmail || 'Registered User'}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${Number(order.totalPrice).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{order.items.length} items</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-700 max-w-md truncate">
                  {order.shippingAddress || order.address?.streetLine1 || 'No address on file'}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer ${getStatusColor(order.status)}`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
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
