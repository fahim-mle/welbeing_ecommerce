import React, { useEffect, useState } from 'react';
import { createProduct, updateProduct } from '../../api/admin';
import { fetchCategories, fetchTags, type Category, type Product, type WellbeingTag } from '../../api/catalog';

interface ProductFormProps {
  initialData?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockStatus: 'IN_STOCK',
    imageUrls: '', // Newline separated
    tagIds: [] as number[],
    ingredients: '',
    usageInstructions: '',
    benefits: '',
    safetyDisclaimers: ''
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<WellbeingTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTags()]).then(([cats, tgs]) => {
      setCategories(cats);
      setTags(tgs);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        price: String(initialData.price),
        categoryId: String(initialData.categoryId),
        stockStatus: initialData.stockStatus,
        imageUrls: initialData.images?.map(i => i.url).join('\n') || '',
        tagIds: initialData.tags?.map(t => t.id) || [],
        ingredients: initialData.ingredients || '',
        usageInstructions: initialData.usageInstructions || '',
        benefits: initialData.benefits || '',
        safetyDisclaimers: initialData.safetyDisclaimers || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        imageUrls: formData.imageUrls.split('\n').map(u => u.trim()).filter(u => u),
        tagIds: formData.tagIds
    };

    try {
        if (initialData) {
            await updateProduct(initialData.id, payload);
        } else {
            await createProduct(payload);
        }
        onSave();
    } catch (err) {
        alert('Failed to save product');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const toggleTag = (id: number) => {
      setFormData(prev => {
          if (prev.tagIds.includes(id)) {
              return { ...prev, tagIds: prev.tagIds.filter(tid => tid !== id) };
          } else {
              return { ...prev, tagIds: [...prev.tagIds, id] };
          }
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Left Col */}
           <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input type="number" step="0.01" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Status</label>
                    <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.stockStatus} onChange={e => setFormData({...formData, stockStatus: e.target.value})}
                    >
                        <option value="IN_STOCK">In Stock</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
           </div>
           
           {/* Right Col */}
           <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Image URLs (one per line)</label>
                    <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 font-mono text-xs"
                        placeholder="https://example.com/image1.jpg"
                        value={formData.imageUrls} onChange={e => setFormData({...formData, imageUrls: e.target.value})}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wellbeing Goals (Tags)</label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(t => (
                            <button key={t.id} type="button"
                                onClick={() => toggleTag(t.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${formData.tagIds.includes(t.id) ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Benefits</label>
                     <textarea rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})}
                    />
                </div>
           </div>
       </div>

       <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
           <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
               Cancel
           </button>
           <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
               {loading ? 'Saving...' : 'Save Product'}
           </button>
       </div>
    </form>
  );
};
