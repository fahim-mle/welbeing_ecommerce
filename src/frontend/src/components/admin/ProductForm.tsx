import React, { useEffect, useState } from 'react';
import { createProduct, updateProduct } from '../../api/admin';
import { fetchCategories, fetchTags, type Category, type Product, type WellbeingTag } from '../../api/catalog';
import { useAuth } from '../../hooks/useAuth';

interface ProductFormProps {
  initialData?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSave, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockQuantity: 0,
    isVisible: true,
    imageUrls: '',
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
        stockQuantity: initialData.stockQuantity || 0,
        isVisible: initialData.isVisible !== undefined ? initialData.isVisible : true,
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
    if (!user) return;
    setLoading(true);

    const payload = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        stockQuantity: parseInt(String(formData.stockQuantity)),
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-6 rounded-xl shadow-sm border border-border-default">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Left Col */}
           <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary">Product Name</label>
                    <input type="text" required className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary">Price</label>
                    <input type="number" step="0.01" required className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary">Category</label>
                    <select required className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                        value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-text-primary">Quantity</label>
                            <input type="number" min="0" required className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input type="checkbox" id="isVisible" className="rounded border-border-default text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                checked={formData.isVisible} onChange={e => setFormData({...formData, isVisible: e.target.checked})}
                            />
                            <label htmlFor="isVisible" className="text-sm font-medium text-text-primary">Visible in Shop</label>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary">Description</label>
                    <textarea rows={3} required className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
           </div>
           
            {/* Right Col */}
            <div className="space-y-4">
                 <div>
                     <label className="block text-sm font-medium text-text-primary">Image URLs (one per line)</label>
                     <textarea rows={4} className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 font-mono text-xs"
                         placeholder="https://example.com/image1.jpg"
                         value={formData.imageUrls} onChange={e => setFormData({...formData, imageUrls: e.target.value})}
                     />
                 </div>
                 
                 <div>
                     <label className="block text-sm font-medium text-text-primary mb-2">Wellbeing Goals (Tags)</label>
                     <div className="flex flex-wrap gap-2">
                         {tags.map(t => (
                             <button key={t.id} type="button"
                                 onClick={() => toggleTag(t.id)}
                                 className={`px-3 py-1 rounded-full text-xs font-medium border ${formData.tagIds.includes(t.id) ? 'bg-primary-100 text-primary-800 border-primary-200' : 'bg-surface text-text-secondary border-border-default hover:bg-surface-alt'}`}
                             >
                                 {t.name}
                             </button>
                         ))}
                     </div>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-text-primary">Benefits</label>
                      <textarea rows={2} className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                         value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})}
                     />
                </div>
           </div>
        </div>

         <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
             <button type="button" onClick={onCancel} className="btn-secondary">
                 Cancel
             </button>
             <button type="submit" disabled={loading} className="btn-primary">
                 {loading ? 'Saving...' : 'Save Product'}
             </button>
         </div>
    </form>
  );
};
