import { AlertCircle, AlertTriangle, ArrowLeft, Check, ChevronUp, ChevronDown, FlaskConical, BookOpen, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchProductById, type Product } from '../api/catalog';
import { useCart } from '../context/CartContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProductById(Number(id));
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;

  const images = product.images.length > 0 ? product.images : [{ id: 0, url: 'https://placehold.co/600x400?text=No+Image', displayOrder: 0 }];

  return (
    <div className="min-h-screen bg-white font-sans">
       {/* Simple Header for Detail Page */}
       <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
             <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Store
             </Link>
          </div>
       </header>

       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
             {/* Image Gallery - Sticky */}
             <div className="flex flex-col-reverse sticky top-24">
                 {/* Thumbnails */}
                 {images.length > 1 && (
                     <div className="mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
                         <div className="grid grid-cols-5 gap-4">
                             {images.map((img, idx) => (
                                 <button
                                     key={img.id || idx}
                                     className={`relative h-20 bg-gray-50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${activeImageIndex === idx ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-80'}`}
                                     onClick={() => setActiveImageIndex(idx)}
                                     aria-label={`View product image ${idx + 1} of ${images.length}`}
                                     aria-pressed={activeImageIndex === idx}
                                 >
                                     <img src={img.url} alt="" className="w-full h-full object-center object-cover" />
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}

                {/* Main Image */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
                    <img
                        src={images[activeImageIndex].url}
                        alt={images[activeImageIndex].altText || product.name}
                        className="w-full h-full object-center object-cover hover:scale-105 transition-transform duration-700"
                    />
                </div>
             </div>

             {/* Product Info */}
             <div className="mt-12 lg:mt-0 lg:pl-8">
                <div className="mb-8">
                     <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wide mb-4">
                        {product.category?.name}
                     </span>
                     <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">{product.name}</h1>
                     <p className="text-4xl font-light text-gray-900">${product.price}</p>
                </div>

                 {/* Status & Actions */}
                 <div className="border-t border-b border-gray-100 py-6 mb-8">
                     <div className="flex items-center justify-between mb-6">
                          {product.stockQuantity > 0 ? (
                              <span className="flex items-center text-green-700 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                                  <Check className="h-4 w-4 mr-1.5" /> In Stock ({product.stockQuantity} available)
                              </span>
                         ) : (
                              <span className="flex items-center text-red-700 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
                                  <AlertCircle className="h-4 w-4 mr-1.5" /> Out of Stock
                              </span>
                         )}
                     </div>
 
                     <button
                        type="button"
                        disabled={product.stockQuantity <= 0}
                        onClick={() => addItem(product)}
                        className="btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        Add to Cart
                     </button>

                   <p className="text-center text-xs text-gray-500 mt-3">
                       Free shipping on orders over $50 • 30-day return policy
                   </p>
                </div>

                 <div className="prose prose-indigo text-gray-600">
                     <h3 className="text-lg font-bold text-gray-900 mb-3">About this product</h3>
                     <p className="leading-relaxed">{product.description}</p>
                 </div>

                 {(product.safetyDisclaimers || product.ingredients || product.usageInstructions || product.benefits) && (
                   <div className="mt-8 border-t border-b border-gray-100 py-6 space-y-4">
                     
                     {product.safetyDisclaimers && (
                       <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                         <div className="flex items-start">
                           <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                           <div>
                             <h4 className="text-sm font-bold text-amber-900 uppercase mb-1">
                               Safety Disclaimer
                             </h4>
                             <p className="text-sm text-amber-800 leading-relaxed">
                               {product.safetyDisclaimers}
                             </p>
                           </div>
                         </div>
                       </div>
                     )}

                     {product.ingredients && (
                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border rounded-lg overflow-hidden">
                         <button
                           onClick={() => setExpandedSection('ingredients')}
                           className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors"
                         >
                           <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                             <FlaskConical className="w-5 h-5 text-blue-500 mr-2" />
                             Ingredients
                             {expandedSection === 'ingredients' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                           </h4>
                         </button>
                         {expandedSection === 'ingredients' && (
                           <div className="px-5 pb-4">
                             <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                               {product.ingredients}
                             </p>
                           </div>
                         )}
                       </div>
                     )}

                     {product.usageInstructions && (
                       <div className="bg-gradient-to-r from-green-50 to-emerald-50 border rounded-lg overflow-hidden">
                         <button
                           onClick={() => setExpandedSection('usageInstructions')}
                           className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 hover:bg-green-100 transition-colors"
                         >
                           <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                             <BookOpen className="w-5 h-5 text-green-500 mr-2" />
                             How to Use
                             {expandedSection === 'usageInstructions' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                           </h4>
                         </button>
                         {expandedSection === 'usageInstructions' && (
                           <div className="px-5 pb-4">
                             <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                               {product.usageInstructions}
                             </p>
                           </div>
                         )}
                       </div>
                     )}

                     {product.benefits && (
                       <div className="bg-gradient-to-r from-purple-50 to-pink-50 border rounded-lg overflow-hidden">
                         <button
                           onClick={() => setExpandedSection('benefits')}
                           className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:bg-purple-100 transition-colors"
                         >
                           <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                             <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
                             Benefits
                             {expandedSection === 'benefits' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                           </h4>
                         </button>
                         {expandedSection === 'benefits' && (
                           <div className="px-5 pb-4">
                             <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                               {product.benefits}
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 )}

                 <div className="mt-10">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Ideally Suited For</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.tags.map(tag => (
                            <span key={tag.id} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 border border-transparent">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
};
