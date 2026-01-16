import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { fetchCategories, fetchTags, type Category, type WellbeingTag } from '../../api/catalog';
import { createCategory, createTag, deleteCategory, deleteTag, updateCategory, updateTag } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';

export const AdminCatalog: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<WellbeingTag[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [tagForm, setTagForm] = useState({ name: '', type: 'GOAL' as WellbeingTag['type'] });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState({ name: '', description: '' });
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState({ name: '', type: 'GOAL' as WellbeingTag['type'] });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    const [categoryData, tagData] = await Promise.all([fetchCategories(), fetchTags()]);
    setCategories(categoryData);
    setTags(tagData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setErrorMessage(null);

    try {
      await createCategory(token, {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      });
      setCategoryForm({ name: '', description: '' });
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category.';
      setErrorMessage(message);
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    if (!token) return;
    setErrorMessage(null);

    try {
      await updateCategory(token, categoryId, {
        name: editingCategory.name,
        description: editingCategory.description || undefined,
      });
      setEditingCategoryId(null);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category.';
      setErrorMessage(message);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!token) return;
    setErrorMessage(null);

    try {
      await deleteCategory(token, categoryId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category.';
      setErrorMessage(message);
    }
  };

  const handleAddTag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setErrorMessage(null);

    try {
      await createTag(token, tagForm);
      setTagForm({ name: '', type: 'GOAL' });
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tag.';
      setErrorMessage(message);
    }
  };

  const handleUpdateTag = async (tagId: number) => {
    if (!token) return;
    setErrorMessage(null);

    try {
      await updateTag(token, tagId, editingTag);
      setEditingTagId(null);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tag.';
      setErrorMessage(message);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!token) return;
    setErrorMessage(null);

    try {
      await deleteTag(token, tagId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Catalog</h2>
        <p className="text-sm text-gray-500">Manage categories and wellbeing tags.</p>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <input
              type="text"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              placeholder="Category name"
              className="form-input"
              required
            />
            <input
              type="text"
              value={categoryForm.description}
              onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
              placeholder="Description (optional)"
              className="form-input"
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </form>

          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-100 rounded-xl p-3">
                {editingCategoryId === category.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(event) =>
                        setEditingCategory({ ...editingCategory, name: event.target.value })
                      }
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={editingCategory.description}
                      onChange={(event) =>
                        setEditingCategory({ ...editingCategory, description: event.target.value })
                      }
                      className="form-input"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(category.id)}
                        className="btn-primary"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-500">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingCategory({
                            name: category.name,
                            description: category.description ?? '',
                          });
                        }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
          <form onSubmit={handleAddTag} className="space-y-3">
            <input
              type="text"
              value={tagForm.name}
              onChange={(event) => setTagForm({ ...tagForm, name: event.target.value })}
              placeholder="Tag name"
              className="form-input"
              required
            />
            <select
              value={tagForm.type}
              onChange={(event) => setTagForm({ ...tagForm, type: event.target.value as WellbeingTag['type'] })}
              className="form-input"
            >
              <option value="GOAL">Goal</option>
              <option value="FEATURE">Feature</option>
              <option value="NEED">Need</option>
            </select>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tag
            </button>
          </form>

          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.id} className="border border-gray-100 rounded-xl p-3">
                {editingTagId === tag.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingTag.name}
                      onChange={(event) => setEditingTag({ ...editingTag, name: event.target.value })}
                      className="form-input"
                    />
                    <select
                      value={editingTag.type}
                      onChange={(event) =>
                        setEditingTag({ ...editingTag, type: event.target.value as WellbeingTag['type'] })
                      }
                      className="form-input"
                    >
                      <option value="GOAL">Goal</option>
                      <option value="FEATURE">Feature</option>
                      <option value="NEED">Need</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleUpdateTag(tag.id)} className="btn-primary">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingTagId(null)} className="btn-ghost">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tag.name}</p>
                      <p className="text-xs text-gray-500">{tag.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingTag({ name: tag.name, type: tag.type });
                        }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
