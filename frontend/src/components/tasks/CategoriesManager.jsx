import React, { useState, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext.jsx';
import { cn } from '../../utils/index.js';

const CategoriesManager = () => {
  const { categories, createCategory, updateCategory, deleteCategory, loadCategories } = useTasks();
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', description: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Введите название категории';
    if (formData.color && !/^#([0-9a-fA-F]{6})$/.test(formData.color)) e.color = 'Используйте HEX, например #3B82F6';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData, name: formData.name.trim() };
      if (editingId) {
        const res = await updateCategory(editingId, payload);
        if (!res.success) setErrors(res.error || { general: res.message || 'Failed to update' });
      } else {
        const res = await createCategory(payload);
        if (!res.success) setErrors(res.error || { general: res.message || 'Failed to create' });
      }
      setFormData({ name: '', color: '#3B82F6', description: '' });
      setEditingId(null);
      await loadCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (cat) => {
    setFormData({ name: cat.name || '', color: cat.color || '#3B82F6', description: cat.description || '' });
    setEditingId(cat.id);
    setErrors({});
  };

  const cancelEdit = () => {
    setFormData({ name: '', color: '#3B82F6', description: '' });
    setEditingId(null);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить эту категорию?')) return;
    await deleteCategory(id);
  };

  const totalTasks = useMemo(() => categories.reduce((acc, c) => acc + (c.task_count || 0), 0), [categories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Категории</h2>
        <span className="text-sm text-gray-600">{categories.length} категорий • {totalTasks} задач</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-4 space-y-4">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.general}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
              className={cn(
                'block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm',
                errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              )}
              placeholder="Например, Работа"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData((s) => ({ ...s, color: e.target.value }))}
                className="h-10 w-12 rounded border border-gray-300"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData((s) => ({ ...s, color: e.target.value }))}
                className={cn(
                  'block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm',
                  errors.color ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                )}
                placeholder="#3B82F6"
              />
            </div>
            {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
              placeholder="Необязательно"
            />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-outline">Отмена</button>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {editingId ? 'Обновить категорию' : 'Добавить категорию'}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
          <div className="col-span-4">Название</div>
          <div className="col-span-2">Цвет</div>
          <div className="col-span-4">Описание</div>
          <div className="col-span-2 text-right">Действия</div>
        </div>
        <div className="divide-y">
          {categories.map((c) => (
            <div key={c.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
              <div className="col-span-4 flex items-center space-x-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="ml-2 text-xs text-gray-500">{c.task_count || 0} задач</span>
              </div>
              <div className="col-span-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">{c.color}</code>
              </div>
              <div className="col-span-4 text-gray-700 truncate">{c.description || '-'}</div>
              <div className="col-span-2 flex items-center justify-end space-x-2">
                <button onClick={() => startEdit(c)} className="btn-outline text-xs">Изменить</button>
                <button onClick={() => handleDelete(c.id)} className="btn-danger text-xs">Удалить</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-600">Категорий пока нет</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesManager;
