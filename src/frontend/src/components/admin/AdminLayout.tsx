import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Users, BarChart3, ShoppingBag, MessageSquare, Menu, X, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Catalog', path: '/admin/catalog', icon: Tag },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface-dark text-white rounded-lg shadow-lg hover:bg-surface-dark transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-surface border-r border-border-default flex flex-col z-40 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-border-default flex-shrink-0">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Admin Console</h1>
        </div>

        {/* Scrollable Navigation Section */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:bg-surface-alt'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sticky Bottom Section */}
        <div className="border-t border-border-default p-4 space-y-2 bg-surface flex-shrink-0">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
          <button
            type="button"
            onClick={async () => {
              closeMobileMenu();
              try {
                await logout();
              } catch (error) {
                console.error('Logout failed:', error);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content - Add left margin on desktop to account for fixed sidebar */}
      <main className="lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
