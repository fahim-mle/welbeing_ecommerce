import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, type AdminUser, updateAdminUser } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { mfaApi } from '../../api/mfa';
import { ShieldOff } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [resetConfirm, setResetConfirm] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) {
      setUsers([]);
      setHasNextPage(false);
      setError('Not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchAdminUsers(page, 20);
      setUsers(res.data);
      setHasNextPage(res.hasNextPage);
    } catch (e) {
      setUsers([]);
      setHasNextPage(false);
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentUser, page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const onToggleActive = async (user: AdminUser) => {
    if (!currentUser) return;
    setUpdatingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const onChangeRole = async (user: AdminUser, role: AdminUser['role']) => {
    if (!currentUser) return;
    setUpdatingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateAdminUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetMfa = async (userId: number) => {
    setResetting(true);
    setError(null);
    setSuccess(null);
    try {
      await mfaApi.resetMfa(userId);
      setResetConfirm(null);
      setSuccess('MFA has been reset successfully. User will need to re-enroll.');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to reset MFA:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset MFA');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage customer accounts, roles, and activation status.</p>
      </div>

      {!currentUser && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Login as an admin to view users.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || !hasNextPage}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-semibold px-6 py-3">User</th>
                  <th className="text-left font-semibold px-6 py-3">Role</th>
                  <th className="text-left font-semibold px-6 py-3">Status</th>
                  <th className="text-left font-semibold px-6 py-3">MFA</th>
                  <th className="text-right font-semibold px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const isUpdating = updatingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
                          value={user.role}
                          disabled={isUpdating}
                          onChange={(e) => onChangeRole(user, e.target.value as AdminUser['role'])}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            user.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.mfaEnabled ? (
                          <button
                            onClick={() => setResetConfirm(user.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Reset MFA"
                          >
                            <ShieldOff className="w-4 h-4 mr-1" />
                            Reset
                          </button>
                        ) : (
                          <span className="text-gray-400">Not enabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-semibold rounded-lg ${
                            user.isActive
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          } disabled:opacity-50`}
                          onClick={() => onToggleActive(user)}
                          disabled={isUpdating}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MFA Reset Confirmation Dialog */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reset MFA?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset MFA for this user? They will need to re-enroll in MFA.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setResetConfirm(null)}
                disabled={resetting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetMfa(resetConfirm)}
                disabled={resetting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset MFA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
