import { Filter, LogOut, LayoutDashboard, Search, ShoppingBag, X, User as UserIcon, Settings } from 'lucide-react'; // Icons
import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCategories, fetchProducts, fetchTags, type Category, type Product, type WellbeingTag } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<WellbeingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Profile dropdown
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filters from URL
  const selectedCategory = searchParams.get('category') ? Number(searchParams.get('category')) : undefined;
  const selectedTag = searchParams.get('tag') ? Number(searchParams.get('tag')) : undefined;
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()]);
        setCategories(cats);
        setTags(tgs);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data, pagination } = await fetchProducts({
          categoryId: selectedCategory,
          tagId: selectedTag,
          search: searchQuery,
          page,
          limit: 9,
        });
        setProducts(data);
        setTotalPages(pagination.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory, selectedTag, searchQuery, page]);

  const updateFilter = (key: string, value: string | undefined) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Modern & Glassy */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">W</div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welbeing</h1>
          </div>

            <div className="flex-1 max-w-md mx-8 relative hidden md:block">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                 </div>
                 <input
                   type="text"
                   placeholder="Search for comfort & recovery..."
                   className="block w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500"
                   value={searchQuery}
                   onChange={(e) => updateFilter('search', e.target.value || undefined)}
                   aria-label="Search products"
                   id="search-input"
                 />
            </div>

           <div className="flex items-center gap-4">
               <button
                 className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 aria-label="Open filter sidebar"
               >
                   <Filter className="h-5 w-5" aria-hidden="true" />
               </button>
               {user ? (
                   <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none"
                            aria-label="User menu"
                            aria-expanded={isProfileOpen}
                        >
                            <UserIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                       
                       {/* Dropdown Menu */}
                       {isProfileOpen && (
                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                               <Link 
                                   to="/profile" 
                                   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                   onClick={() => setIsProfileOpen(false)}
                               >
                                   <Settings className="h-4 w-4" />
                                   Profile
                               </Link>
                               {user.role === 'ADMIN' && (
                                   <Link 
                                       to="/admin" 
                                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                       onClick={() => setIsProfileOpen(false)}
                                   >
                                       <LayoutDashboard className="h-4 w-4" />
                                       Dashboard
                                   </Link>
                               )}
                               <button
                                   onClick={() => {
                                       logout();
                                       setIsProfileOpen(false);
                                   }}
                                   className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                               >
                                   <LogOut className="h-4 w-4" />
                                   Logout
                               </button>
                           </div>
                       )}
                   </div>
               ) : (
                   <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 hidden md:block">
                       Login
                   </Link>
               )}
                <Link to="/checkout" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full" aria-label={`Shopping cart with ${totalItems} items`}>
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-semibold rounded-full px-1.5" aria-hidden="true">
                      {totalItems}
                    </span>
                  )}
                </Link>

           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Clean & Minimal */}
          <aside className={`w-64 flex-shrink-0 ${isSidebarOpen ? 'fixed inset-0 z-40 bg-white p-6 shadow-2xl duration-300 ease-in-out' : 'hidden md:block'}`}>
             <div className="md:hidden flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                 <button onClick={() => setIsSidebarOpen(false)}><X className="h-6 w-6 text-gray-500" /></button>
             </div>

             <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    <button
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => updateFilter('category', undefined)}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => updateFilter('category', String(cat.id))}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Wellbeing Goals
                  </h3>
                   <div className="space-y-1">
                    <button
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTag ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => updateFilter('tag', undefined)}
                    >
                        Any Goal
                    </button>
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTag === tag.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => updateFilter('tag', String(tag.id))}
                      >
                         {tag.name}
                      </button>
                    ))}
                   </div>
                </div>
             </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
             <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
                    <span className="text-gray-400 text-lg font-normal ml-2">({products.length})</span>
                </h2>
                {/* Sort dropdown could go here */}
             </div>

             {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {[1,2,3,4,5,6].map(i => (
                         <div key={i} className="bg-white h-96 rounded-2xl animate-pulse shadow-sm border border-gray-100">
                            <div className="h-2/3 bg-gray-200 rounded-t-2xl"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                         </div>
                     ))}
                 </div>
             ) : products.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                     <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <Search className="h-full w-full" />
                     </div>
                     <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                     <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
                      <button
                         onClick={() => setSearchParams(new URLSearchParams())}
                         className="btn-ghost mt-6 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                         aria-label="Clear all filters"
                     >
                         Clear all filters
                      </button>
                 </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 flex items-center">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
