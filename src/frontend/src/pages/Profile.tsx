import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders, type OrderResponse } from '../api/orders';
import { Link, useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admin to dashboard immediately
    if (user?.role === 'ADMIN') {
        navigate('/admin');
        return;
    }

    if (token) {
      setLoading(true);
      fetchMyOrders(token)
        .then(setOrders)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token, user, navigate]);

  if (!user) {
    return <div className="p-4">Please log in to view your profile.</div>;
  }

  // Double check to prevent flash of content before redirect
  if (user.role === 'ADMIN') {
      return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Details</h2>
        <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
        <p className="text-gray-700"><strong>Role:</strong> {user.role}</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p>No orders found. <Link to="/" className="text-blue-600">Start shopping!</Link></p>
        )}
        
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded hover:bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Order #{order.id}</span>
                <span className="text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                 <span className={`px-2 py-1 rounded text-sm ${order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.status}
                 </span>
                 <span className="font-bold">${order.totalPrice}</span>
              </div>
              <div className="text-sm text-gray-600">
                {order.items.length} items
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
