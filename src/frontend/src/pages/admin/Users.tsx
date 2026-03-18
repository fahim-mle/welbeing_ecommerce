import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, type AdminUser, updateAdminUser } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { mfaApi } from '../../api/mfa';
import { Search, X, Shield, ShieldOff } from 'lucide-react';
import { Pagination } from '../../components/admin/Pagination';
import { FilterDropdown } from '../../components/admin/FilterDropdown';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mfaFilter, setMfaFilter] = useState('all');
  
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [resetConfirm, setResetConfirm] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) {
      setUsers([]);
      setError('Not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchAdminUsers(currentPage, limit, {
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        mfaEnabled: mfaFilter,
      });
      setUsers(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setUsers([]);
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentPage, debouncedSearch, roleFilter, statusFilter, mfaFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, mfaFilter]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setMfaFilter('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || mfaFilter !== 'all';

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage customer accounts, roles, and activation status.</p>
      </div>

      {!currentUser && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Login as an admin to view users.
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email, first name, or last name..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FilterDropdown
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          
          <FilterDropdown
            label="MFA"
            value={mfaFilter}
            onChange={setMfaFilter}
            options={[
              { value: 'all', label: 'All MFA' },
              { value: 'true', label: 'Enabled' },
              { value: 'false', label: 'Disabled' },
            ]}
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters
              ? 'No users match your search criteria'
              : 'No users in the system yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <button
                                onClick={() => setResetConfirm(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reset MFA"
                              >
                                Reset
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ShieldOff className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400">Not enabled</span>
                            </div>
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
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </>
      )}

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
