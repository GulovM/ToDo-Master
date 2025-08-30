import React from 'react';
import { useTasks } from '../../context/TaskContext.jsx';
import { cn } from '../../utils/index.js';

const TaskFilters = () => {
  const { categories, filters, setFilters } = useTasks();

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      priority: '',
      is_done: null,
      is_overdue: false,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.category ||
      filters.priority ||
      filters.is_done !== null ||
      filters.is_overdue
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Фильтры</h3>
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            Сбросить все фильтры
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.task_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Приоритет
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Все приоритеты</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={filters.is_done === null ? '' : filters.is_done.toString()}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('is_done', value === '' ? null : value === 'true');
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Все</option>
            <option value="false">В работе</option>
            <option value="true">Выполнено</option>
          </select>
        </div>

        {/* Overdue Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Особые фильтры
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.is_overdue || false}
                onChange={(e) => handleFilterChange('is_overdue', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Только просроченные</span>
            </label>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Активные фильтры:</span>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Категория: {categories.find(c => c.id.toString() === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-1.5 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Приоритет: {filters.priority}
                <button
                  onClick={() => handleFilterChange('priority', '')}
                  className="ml-1.5 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.is_done !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Статус: {filters.is_done ? 'Выполнено' : 'В работе'}
                <button
                  onClick={() => handleFilterChange('is_done', null)}
                  className="ml-1.5 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.is_overdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Только просроченные
                <button
                  onClick={() => handleFilterChange('is_overdue', false)}
                  className="ml-1.5 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
