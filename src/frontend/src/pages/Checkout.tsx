import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentPlaceholder, setPaymentPlaceholder] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setGuestEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder({
        guest_email: guestEmail,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        payment_placeholder: paymentPlaceholder,
        disclaimer_accepted: disclaimerAccepted,
      }, token || undefined);

      clearCart();
      navigate('/order-confirmation', { state: { order } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add a few wellbeing essentials before checking out.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            Continue shopping
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{user ? 'Checkout' : 'Guest Checkout'}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[2fr,1fr] gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Shipping & Contact</h2>
            <p className="text-sm text-gray-500">{user ? `Logged in as ${user.email}` : 'Checkout as a guest — no account required.'}</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                disabled={!!user}
                className={`mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${user ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Shipping address</span>
              <textarea
                required
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Street, City, State, ZIP"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Placeholder</h3>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Simulated payment</span>
              <input
                type="text"
                required
                value={paymentPlaceholder}
                onChange={(event) => setPaymentPlaceholder(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Card ending in 4242"
              />
            </label>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-sm text-indigo-900 font-medium mb-2">Health Disclaimer</p>
            <p className="text-xs text-indigo-700">
              Products are not intended to diagnose, treat, cure, or prevent any disease. Always consult a healthcare
              professional for medical advice.
            </p>
            <label className="mt-4 flex items-start gap-3 text-sm text-indigo-900">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(event) => setDisclaimerAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              I acknowledge the health disclaimer.
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Processing...' : `Place Order • $${subtotal.toFixed(2)}`}
          </button>
        </form>

        <CartSummary />
      </main>
    </div>
  );
};
