import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { fetchAddresses, type Address } from '../api/addresses';
import { fetchMyOrders, type OrderResponse } from '../api/orders';
import { useAuth } from '../hooks/useAuth';

const tabs = ['overview', 'orders', 'addresses', 'security'] as const;

type TabKey = typeof tabs[number];

export const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersHasNext, setOrdersHasNext] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const loadProfile = async () => {
      try {
        const profile = await authApi.fetchProfile(token);
        updateUser({
          id: profile.id,
          email: profile.email,
          role: profile.role,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? null,
          isActive: profile.isActive,
        });
        setProfileForm({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phone: profile.phone ?? '',
        });
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };

    loadProfile();
  }, [token, updateUser]);

  useEffect(() => {
    if (!token || activeTab !== 'addresses') return;
    const loadAddresses = async () => {
      try {
        const data = await fetchAddresses(token);
        setAddresses(data);
      } catch (err) {
        console.error('Failed to load addresses', err);
      }
    };

    loadAddresses();
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || activeTab !== 'orders') return;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const result = await fetchMyOrders(token, ordersPage, 6);
        setOrders(result.data);
        setOrdersHasNext(result.hasNextPage);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load orders';
        setOrdersError(message);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [token, activeTab, ordersPage]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setProfileMessage(null);
    setProfileError(null);

    try {
      const updated = await authApi.updateProfile(token, profileForm);
      updateUser({
        id: updated.id,
        email: updated.email,
        role: updated.role,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone ?? null,
        isActive: updated.isActive,
      });
      setIsEditingProfile(false);
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileError(message);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!token) return;
    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (passwordForm.password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      await authApi.changePassword(token, passwordForm.currentPassword, passwordForm.password);
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ currentPassword: '', password: '', confirm: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordError(message);
    }
  };

  const profileSummary = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'Email', value: user.email },
      { label: 'Role', value: user.role },
      { label: 'First name', value: user.firstName || '—' },
      { label: 'Last name', value: user.lastName || '—' },
      { label: 'Phone', value: user.phone || '—' },
    ];
  }, [user]);

  if (!user) {
    return <div className="p-4">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-500">Manage your profile and track orders.</p>
          </div>
          <div className="flex gap-3">
            {user.role === 'ADMIN' ? (
              <Link to="/admin" className="btn-primary">
                Back to Dashboard
              </Link>
            ) : (
              <Link to="/" className="btn-ghost">
                Back to Shop
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setProfileMessage(null);
                  setProfileError(null);
                  setPasswordMessage(null);
                  setPasswordError(null);
                }}
                className={`px-6 py-4 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Overview</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {profileMessage && <p className="text-sm text-green-600">{profileMessage}</p>}
                {profileError && <p className="text-sm text-red-600">{profileError}</p>}

                {!isEditingProfile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profileSummary.map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <span className="form-label">First name</span>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })}
                        className="form-input"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="form-label">Last name</span>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })}
                        className="form-input"
                      />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="form-label">Phone</span>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                        className="form-input"
                      />
                    </label>
                    <div className="sm:col-span-2 flex gap-3">
                      <button type="submit" className="btn-primary">
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
                      disabled={ordersPage === 1}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-gray-500">Page {ordersPage}</span>
                    <button
                      type="button"
                      onClick={() => setOrdersPage((prev) => prev + 1)}
                      disabled={!ordersHasNext}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {ordersLoading && <p className="text-sm text-gray-500">Loading orders...</p>}
                {ordersError && <p className="text-sm text-red-600">{ordersError}</p>}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <p className="text-sm text-gray-500">No orders found yet.</p>
                )}

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Order #{order.id}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {order.status}
                          </span>
                          {order.paymentStatus && (
                            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                              {order.paymentStatus}
                            </span>
                          )}
                          <span className="text-sm font-bold text-gray-900">${Number(order.totalPrice).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{order.items.length} items</span>
                        <Link to={`/orders/${order.id}`} className="text-indigo-600 hover:underline">
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved addresses yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-100 rounded-xl p-4">
                        {address.isDefault && (
                          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900 mt-2">{address.label}</p>
                        <p className="text-xs text-gray-500">{address.fullName}</p>
                        <p className="text-xs text-gray-500">{address.streetLine1}</p>
                        <p className="text-xs text-gray-500">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-xs text-gray-500">{address.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <label className="space-y-2">
                    <span className="form-label">Current password</span>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                      }
                      className="form-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="form-label">New password</span>
                    <input
                      type="password"
                      value={passwordForm.password}
                      onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
                      className="form-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="form-label">Confirm password</span>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })}
                      className="form-input"
                    />
                  </label>
                  <button type="submit" className="btn-primary">
                    Update password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
