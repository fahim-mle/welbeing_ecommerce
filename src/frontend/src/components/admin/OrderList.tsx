import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/admin';
import type { OrderResponse } from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
        setLoading(true);
        fetchAdminOrders(token)
            .then(setOrders)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }
  }, [token]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
      if (!token) return;
      try {
          const updatedOrder = await updateOrderStatus(token, orderId, newStatus);
          setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      } catch (err) {
          alert('Failed to update status');
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'PAID': return 'bg-green-100 text-green-800';
          case 'SHIPPED': return 'bg-blue-100 text-blue-800';
          case 'DELIVERED': return 'bg-indigo-100 text-indigo-800';
          case 'CANCELLED': return 'bg-red-100 text-red-800';
          default: return 'bg-yellow-100 text-yellow-800';
      }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200">
        {orders.map((order) => (
          <li key={order.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-lg font-medium text-indigo-600">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">{order.guestEmail || 'Registered User'}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold">${order.totalPrice}</div>
                    <div className="text-sm text-gray-600">{order.items.length} items</div>
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-700 max-w-md truncate">
                    {order.shippingAddress}
                </div>
                <div>
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
