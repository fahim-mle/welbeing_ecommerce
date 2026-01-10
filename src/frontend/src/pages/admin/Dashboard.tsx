import { LayoutDashboard, Package, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductForm } from '../../components/admin/ProductForm';
import { ProductList } from '../../components/admin/ProductList';
import type { Product } from '../../api/catalog';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin</h1>
        </div>
        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="h-5 w-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Orders (Pending)
          </button>
          <div className="pt-4 mt-4 border-t border-gray-100">
             <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                Back to Store
             </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
           {activeTab === 'products' && (
               <div>
                   {!isCreating && !editingProduct ? (
                       <>
                           <div className="flex justify-between items-center mb-8">
                               <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                               <button 
                                 onClick={() => setIsCreating(true)}
                                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                               >
                                   <Plus className="h-4 w-4" />
                                   Add Product
                               </button>
                           </div>
                           <ProductList onEdit={(product) => setEditingProduct(product)} />
                       </>
                   ) : (
                       <div>
                           <div className="flex justify-between items-center mb-8">
                               <h2 className="text-2xl font-bold text-gray-900">
                                   {isCreating ? 'Create New Product' : 'Edit Product'}
                               </h2>
                           </div>
                           <ProductForm 
                               initialData={editingProduct} 
                               onSave={() => {
                                   setIsCreating(false);
                                   setEditingProduct(null);
                               }}
                               onCancel={() => {
                                   setIsCreating(false);
                                   setEditingProduct(null);
                               }}
                           />
                       </div>
                   )}
               </div>
           )}
           
           {activeTab === 'orders' && (
               <div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Management</h2>
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                       Order List (Future Scope)
                   </div>
               </div>
           )}
        </div>
      </main>
    </div>
  );
};
