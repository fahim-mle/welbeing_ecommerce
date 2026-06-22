import { LayoutDashboard, Package, Tag, Users, BarChart3 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Orders', path: '/admin/orders', icon: LayoutDashboard, description: 'Track customer orders and fulfillment.' },
  { label: 'Products', path: '/admin/products', icon: Package, description: 'Manage product catalog and inventory.' },
  { label: 'Catalog', path: '/admin/catalog', icon: Tag, description: 'Update categories and tags.' },
  { label: 'Users', path: '/admin/users', icon: Users, description: 'Manage customer accounts and roles.' },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, description: 'Review sales and performance trends.' },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-2">Manage your storefront operations from a single place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.path}
              className="bg-surface rounded-2xl shadow-sm border border-border-default p-6 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{link.label}</h2>
                  <p className="text-sm text-text-secondary mt-1">{link.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
