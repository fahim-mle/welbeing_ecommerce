import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAddress, fetchAddresses, type Address } from '../api/addresses';
import { createOrder, type ShippingAddressPayload } from '../api/orders';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../context/useCart';
import { useAuth } from '../hooks/useAuth';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [paymentPlaceholder, setPaymentPlaceholder] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addressForm, setAddressForm] = useState<ShippingAddressPayload>({
    label: 'Home',
    fullName: '',
    phone: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: true,
  });

  useEffect(() => {
    if (user?.email) {
      setGuestEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const loadAddresses = async () => {
      try {
        const data = await fetchAddresses(token);
        setSavedAddresses(data);
        if (data.length > 0) {
          const defaultAddress = data.find((address) => address.isDefault) ?? data[0];
          setSelectedAddressId(defaultAddress.id);
        } else {
          setSelectedAddressId('new');
        }
      } catch (err) {
        console.error('Failed to load addresses', err);
      }
    };
    loadAddresses();
  }, [token]);

  const handleAddressChange = (field: keyof ShippingAddressPayload, value: string) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showNewAddressForm = !user || selectedAddressId === 'new' || savedAddresses.length === 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const nextErrors: Record<string, string> = {};

    if (!guestEmail) {
      nextErrors.guestEmail = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      nextErrors.guestEmail = 'Please enter a valid email address.';
    }

    if (!paymentPlaceholder) {
      nextErrors.paymentPlaceholder = 'Payment placeholder is required.';
    }

    if (!disclaimerAccepted) {
      nextErrors.disclaimerAccepted = 'You must accept the disclaimer.';
    }

    const requiresNewAddress = !user || selectedAddressId === 'new' || selectedAddressId === null;

    if (requiresNewAddress) {
      if (!addressForm.label) nextErrors.label = 'Label is required.';
      if (!addressForm.fullName) nextErrors.fullName = 'Full name is required.';
      if (!addressForm.phone) nextErrors.phone = 'Phone is required.';
      if (!addressForm.streetLine1) nextErrors.streetLine1 = 'Street address is required.';
      if (!addressForm.city) nextErrors.city = 'City is required.';
      if (!addressForm.state) nextErrors.state = 'State is required.';
      if (!addressForm.postalCode) nextErrors.postalCode = 'Postal code is required.';
      if (!addressForm.country) nextErrors.country = 'Country is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please review the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      let addressId: number | undefined;
      let shippingAddress: ShippingAddressPayload | undefined;

      if (user && token) {
        if (selectedAddressId === 'new') {
          const createdAddress = await createAddress(addressForm, token);
          addressId = createdAddress.id;
        } else if (selectedAddressId) {
          addressId = selectedAddressId;
        }
      } else {
        shippingAddress = addressForm;
      }

      const order = await createOrder(
        {
          guest_email: guestEmail,
          items: items.map((item) => ({
            product_id: item.product.id,
            product_variant_id: item.variant?.id,
            quantity: item.quantity,
          })),
          shipping_address: shippingAddress,
          address_id: addressId,
          payment_placeholder: paymentPlaceholder,
          disclaimer_accepted: disclaimerAccepted,
        },
        token || undefined,
      );

      clearCart();
      const guestQuery = token ? '' : `?guestEmail=${encodeURIComponent(guestEmail)}`;
      navigate(`/order-confirmation/${order.id}${guestQuery}`, { state: { order } });
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
          className="btn-primary rounded-full"
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

          <div className="space-y-6">
            <label>
              <span className="form-label">Email</span>
              <input
                id="checkout-email"
                type="email"
                required
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                disabled={!!user}
                className={`form-input ${user ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                aria-label="Email address for guest checkout"
              />
              {fieldErrors.guestEmail && (
                <span className="text-xs text-red-600">{fieldErrors.guestEmail}</span>
              )}
            </label>

            {user && savedAddresses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved addresses</h3>
                <div className="space-y-2">
                  {savedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="saved-address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{address.label}</p>
                        <p className="text-xs text-gray-500">
                          {address.streetLine1}, {address.city}, {address.state} {address.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer">
                    <input
                      type="radio"
                      name="saved-address"
                      value="new"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Use a new address</p>
                      <p className="text-xs text-gray-500">Enter a fresh shipping address below.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {showNewAddressForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="sm:col-span-2">
                  <span className="form-label">Address label</span>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(event) => handleAddressChange('label', event.target.value)}
                    className="form-input"
                    placeholder="Home or Office"
                  />
                  {fieldErrors.label && (
                    <span className="text-xs text-red-600">{fieldErrors.label}</span>
                  )}
                </label>
                <label>
                  <span className="form-label">Full name</span>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(event) => handleAddressChange('fullName', event.target.value)}
                    className="form-input"
                    placeholder="Full name"
                  />
                  {fieldErrors.fullName && (
                    <span className="text-xs text-red-600">{fieldErrors.fullName}</span>
                  )}
                </label>
                <label>
                  <span className="form-label">Phone</span>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(event) => handleAddressChange('phone', event.target.value)}
                    className="form-input"
                    placeholder="Phone number"
                  />
                  {fieldErrors.phone && (
                    <span className="text-xs text-red-600">{fieldErrors.phone}</span>
                  )}
                </label>
                <label className="sm:col-span-2">
                  <span className="form-label">Street address</span>
                  <input
                    type="text"
                    value={addressForm.streetLine1}
                    onChange={(event) => handleAddressChange('streetLine1', event.target.value)}
                    className="form-input"
                    placeholder="Street address"
                  />
                  {fieldErrors.streetLine1 && (
                    <span className="text-xs text-red-600">{fieldErrors.streetLine1}</span>
                  )}
                </label>
                <label className="sm:col-span-2">
                  <span className="form-label">Apartment, suite, etc. (optional)</span>
                  <input
                    type="text"
                    value={addressForm.streetLine2 ?? ''}
                    onChange={(event) => handleAddressChange('streetLine2', event.target.value)}
                    className="form-input"
                    placeholder="Apartment, suite, etc."
                  />
                </label>
                <label>
                  <span className="form-label">City</span>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(event) => handleAddressChange('city', event.target.value)}
                    className="form-input"
                    placeholder="City"
                  />
                  {fieldErrors.city && (
                    <span className="text-xs text-red-600">{fieldErrors.city}</span>
                  )}
                </label>
                <label>
                  <span className="form-label">State</span>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(event) => handleAddressChange('state', event.target.value)}
                    className="form-input"
                    placeholder="State"
                  />
                  {fieldErrors.state && (
                    <span className="text-xs text-red-600">{fieldErrors.state}</span>
                  )}
                </label>
                <label>
                  <span className="form-label">Postal code</span>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(event) => handleAddressChange('postalCode', event.target.value)}
                    className="form-input"
                    placeholder="ZIP / Postal code"
                  />
                  {fieldErrors.postalCode && (
                    <span className="text-xs text-red-600">{fieldErrors.postalCode}</span>
                  )}
                </label>
                <label>
                  <span className="form-label">Country</span>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(event) => handleAddressChange('country', event.target.value)}
                    className="form-input"
                    placeholder="Country"
                  />
                  {fieldErrors.country && (
                    <span className="text-xs text-red-600">{fieldErrors.country}</span>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Placeholder</h3>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-900">
              Payment is simulated for now. No real charge will be made.
            </div>
            <label>
              <span className="form-label">Simulated payment</span>
              <input
                id="checkout-payment"
                type="text"
                required
                value={paymentPlaceholder}
                onChange={(event) => setPaymentPlaceholder(event.target.value)}
                className="form-input"
                placeholder="Card ending in 4242"
                aria-label="Payment information placeholder"
              />
              {fieldErrors.paymentPlaceholder && (
                <span className="text-xs text-red-600">{fieldErrors.paymentPlaceholder}</span>
              )}
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
            {fieldErrors.disclaimerAccepted && (
              <span className="text-xs text-red-600">{fieldErrors.disclaimerAccepted}</span>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-base font-semibold"
            aria-label="Place order"
          >
            {isSubmitting ? 'Processing...' : `Place Order • $${subtotal.toFixed(2)}`}
          </button>
        </form>

        <CartSummary />
      </main>
    </div>
  );
};
