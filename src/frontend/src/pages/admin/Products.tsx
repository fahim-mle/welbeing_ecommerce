import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../../api/catalog';
import { ProductForm } from '../../components/admin/ProductForm';
import { ProductList } from '../../components/admin/ProductList';

export const AdminProducts: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setView('edit');
  };

  const handleSave = () => {
    setView('list');
    setEditingProduct(null);
  };

  return (
    <div className="p-8 space-y-6">
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Products</h2>
              <p className="text-sm text-text-secondary">Create, edit, and organize products.</p>
            </div>
            <button
              type="button"
              onClick={() => setView('create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
          <ProductList onEdit={handleEdit} />
        </>
      )}

      {(view === 'create' || view === 'edit') && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setView('list')}
            className="text-sm text-primary-600 hover:underline"
          >
            ← Back to products
          </button>
          <h2 className="text-2xl font-bold text-text-primary">
            {view === 'create' ? 'Create Product' : 'Edit Product'}
          </h2>
          <ProductForm
            initialData={editingProduct}
            onSave={handleSave}
            onCancel={() => setView('list')}
          />
        </div>
      )}
    </div>
  );
};
