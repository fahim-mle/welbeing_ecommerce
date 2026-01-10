import { Edit, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fetchAdminProducts, deleteProduct, updateProduct } from '../../api/admin';
import type { Product } from '../../api/catalog';

interface ProductListProps {
  onEdit: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onEdit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const toggleStock = async (product: Product) => {
      const newStatus = product.stockStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK';
      try {
          const updated = await updateProduct(product.id, { stockStatus: newStatus });
          setProducts(products.map(p => p.id === product.id ? updated : p));
      } catch (err) {
          alert('Failed to update stock status');
      }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {products.map((product) => (
          <li key={product.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                      {product.images && product.images[0] ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={product.images[0].url} alt="" />
                      ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                      )}
                  </div>
                  <div className="ml-4">
                      <div className="text-sm font-medium text-indigo-600">{product.name}</div>
                      <div className="text-sm text-gray-500">${Number(product.price).toFixed(2)}</div>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleStock(product)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${product.stockStatus === 'IN_STOCK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                      {product.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button onClick={() => onEdit(product)} className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                  </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
