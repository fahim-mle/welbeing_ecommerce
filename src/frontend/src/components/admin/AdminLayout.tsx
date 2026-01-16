import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Users, BarChart3, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Catalog', path: '/admin/catalog', icon: Tag },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Console</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Back to Store
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
