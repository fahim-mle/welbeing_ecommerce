import React from 'react';
import { OrderList } from '../../components/admin/OrderList';

export const AdminOrders: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Orders</h2>
        <p className="text-sm text-text-secondary">Review and update customer orders.</p>
      </div>
      <OrderList />
    </div>
  );
};
