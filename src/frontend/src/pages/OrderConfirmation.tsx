import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { fetchOrder, type OrderResponse } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/PageLoader';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const stateOrder = (location.state as { order?: OrderResponse } | null)?.order;
  const guestEmail = searchParams.get('guestEmail')?.toLowerCase();

  const [order, setOrder] = useState<OrderResponse | null>(stateOrder ?? null);
  const [loading, setLoading] = useState(Boolean(orderId && !stateOrder));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || stateOrder) {
      setLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user && !guestEmail) {
      setError('Please sign in or provide the guest email to view this order.');
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
    fetchOrder(parsedId, guestEmail || undefined)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load order details. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [orderId, stateOrder, user, authLoading, guestEmail]);

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">{error || 'No order found'}</h1>
        <p className="text-text-secondary mb-6">Your confirmation details are unavailable.</p>
        <Link to="/" className="btn-primary rounded-full">
          Back to store
        </Link>
      </div>
    );
  }

  const contactEmail = order.user?.email || order.guestEmail || 'Not available';
  const paymentStatus = order.paymentStatus ?? 'PENDING';

  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-text-secondary hover:text-primary-600">
            Back to store
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Order Confirmed</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface rounded-2xl shadow-sm border border-border-default p-8 space-y-8">
          <div>
            <p className="text-sm text-primary-600 font-semibold">Thank you for your purchase</p>
            <h2 className="text-2xl font-bold text-text-primary">Order #{order.id}</h2>
            <p className="text-sm text-text-secondary">Confirmation sent to {contactEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Items</h3>
              <div className="border-t border-border-default pt-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
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
              <div className="border-t border-border-default pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>GST</span>
                  <span>${Number(order.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-secondary">Total</span>
                  <span className="text-lg font-bold text-text-primary">${Number(order.totalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Delivery Address</h3>
                {order.address ? (
                  <div className="text-sm text-text-secondary bg-surface-alt p-4 rounded-lg">
                    <p className="font-semibold text-text-primary">{order.address.fullName}</p>
                    <p>{order.address.streetLine1}</p>
                    {order.address.streetLine2 && <p>{order.address.streetLine2}</p>}
                    <p>
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p>{order.address.country}</p>
                    <p className="mt-2 text-xs text-text-secondary">Phone: {order.address.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">{order.shippingAddress || 'No address details available.'}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Payment Status</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paymentStatus === 'PAID'
                      ? 'bg-success-100 text-success-700'
                      : paymentStatus === 'FAILED'
                      ? 'bg-danger-100 text-danger-700'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Status History</h3>
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
                  <div className="text-sm text-text-secondary">
                    Current status: <span className="font-medium text-text-primary">{order.status}</span>
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
