import { Edit, Eye, EyeOff, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { deleteProduct, fetchAdminProducts, updateProduct } from '../../api/admin';
import type { Product } from '../../api/catalog';
import { useAuth } from '../../hooks/useAuth';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Pagination } from './Pagination';

interface ProductListProps {
  onEdit: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onEdit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const loadProducts = useCallback(async (page?: number) => {
    if (!user) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const pageToFetch = page !== undefined ? page : currentPage;
      const result = await fetchAdminProducts(pageToFetch, limit, debouncedSearch || undefined);
      setProducts(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, debouncedSearch, limit]);

  useEffect(() => {
    loadProducts(currentPage);
  }, [loadProducts, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    loadProducts(1);
  }, [debouncedSearch, loadProducts]);

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete product');
    }
  };

  const toggleStock = async (product: Product) => {
    if (!user) return;
    const newQty = product.stockQuantity > 0 ? 0 : 10;

    try {
      const updated = await updateProduct(product.id, { stockQuantity: newQty });
      setProducts(products.map((p) => (p.id === product.id ? updated : p)));
    } catch {
      alert('Failed to update stock status');
    }
  };

  const toggleVisibility = async (product: Product) => {
      if (!user) return;
      try {
          const updated = await updateProduct(product.id, { isVisible: !product.isVisible });
          setProducts(products.map(p => p.id === product.id ? updated : p));
      } catch {
          alert('Failed to update visibility');
      }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name, SKU, or description..."
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => loadProducts()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && total === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? `No products match "${searchTerm}"`
              : 'Get started by adding a new product.'}
          </p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Products List */}
      {!loading && !error && total > 0 && (
        <>
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
                        <button onClick={() => toggleVisibility(product)} className="text-gray-400 hover:text-gray-600" title="Toggle Visibility">
                            {product.isVisible ? <Eye className="h-5 w-5 text-green-600" /> : <EyeOff className="h-5 w-5 text-gray-400" />}
                        </button>
                        <div className="text-sm text-gray-500 font-medium w-16 text-center">
                            Qty: {product.stockQuantity}
                        </div>
                        <button
                          onClick={() => toggleStock(product)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
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
    </div>
  );
};
