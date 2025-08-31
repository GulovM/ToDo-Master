import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';
import { cn, dateUtils, priorityUtils } from '../../utils/index.js';
import AiChatModal from '../common/AiChatModal.jsx';
import { SparklesIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import Toast from '../common/Toast.jsx';
import TaskItem from './TaskItem.jsx';
import TaskForm from './TaskForm.jsx';
import TaskFilters from './TaskFilters.jsx';

const TaskList = () => {
  const { user } = useAuth();
  const {
    tasks,
    categories,
    stats,
    isLoading,
    error,
    selectedTasks,
    filters,
    loadTasks,
    setFilters,
    bulkUpdateTasks,
    selectAllTasks,
    setSelectedTasks,
    clearError,
  } = useTasks();

  // view mode toggle removed
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  // Folder-specific controls
  const [expandedCategoryId, setExpandedCategoryId] = useState(null); // category id or 'none'
  const [folderSortBy, setFolderSortBy] = useState(''); // '' | 'priority' | 'deadline'
  const [folderSortOrder, setFolderSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [folderStatusTab, setFolderStatusTab] = useState('pending'); // 'pending' | 'completed'
  
  // Reset selection when leaving selection mode
  useEffect(() => {
    if (!selectionMode && selectedTasks.length > 0) {
      setSelectedTasks([]);
    }
  }, [selectionMode, selectedTasks.length, setSelectedTasks]);

  // Restore folder UI state from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('tasks.folderUI') || '{}');
      if (stored.expandedCategoryId !== undefined) setExpandedCategoryId(stored.expandedCategoryId);
      if (stored.folderSortBy) setFolderSortBy(stored.folderSortBy);
      if (stored.folderSortOrder) setFolderSortOrder(stored.folderSortOrder);
      if (stored.folderStatusTab) setFolderStatusTab(stored.folderStatusTab);
    } catch (_) {}
  }, []);

  // Persist folder UI state
  useEffect(() => {
    const payload = {
      expandedCategoryId,
      folderSortBy,
      folderSortOrder,
      folderStatusTab,
    };
    try { localStorage.setItem('tasks.folderUI', JSON.stringify(payload)); } catch (_) {}
  }, [expandedCategoryId, folderSortBy, folderSortOrder, folderStatusTab]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.search, setFilters]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Reset folder controls when switching folder
  useEffect(() => {
    setFolderSortBy('');
    setFolderSortOrder('asc');
    setFolderStatusTab('pending');
  }, [expandedCategoryId]);

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedTasks.length === 0) {
      setToast({
        type: 'warning',
        message: 'Выберите хотя бы одну задачу',
      });
      return;
    }

    const result = await bulkUpdateTasks(selectedTasks, action);
    
    if (result.success) {
      setToast({
        type: 'success',
        message: result.message,
      });
      setSelectedTasks([]);
    } else {
      setToast({
        type: 'error',
        message: result.error?.message || 'Групповая операция не выполнена',
      });
    }
  };

  // Handle task edit
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Handle task form close
  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Handle select all
  const handleSelectAll = () => {
    const allSelected = selectedTasks.length === tasks.length;
    selectAllTasks(!allSelected);
  };

  // Group tasks by category (apply search only)
  const taskGroups = useMemo(() => {
    const matchesSearch = (t) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    };

    const map = new Map();
    // initialize from categories
    categories.forEach((c) => {
      map.set(c.id, { id: c.id, name: c.name, color: c.color, tasks: [] });
    });
    // uncategorized
    const noneKey = 'none';
    if (!map.has(noneKey)) map.set(noneKey, { id: noneKey, name: 'Без категории', color: '#6B7280', tasks: [] });

    tasks.forEach((t) => {
      if (!matchesSearch(t)) return;
      const key = t.category ?? noneKey;
      if (!map.has(key)) {
        // in case category list is stale
        map.set(key, { id: key, name: t.category_name || 'Без категории', color: t.category_color || '#6B7280', tasks: [] });
      }
      map.get(key).tasks.push(t);
    });

    // filter out empty groups
    const groups = Array.from(map.values()).filter((g) => g.tasks.length > 0);
    // Ensure 'Без категории' (none) в конце
    return groups.sort((a, b) => (a.id === 'none' ? 1 : b.id === 'none' ? -1 : 0));
  }, [tasks, categories, searchTerm]);

  // Get tasks for expanded group with folder-local status + sort
  const getExpandedVisibleTasks = () => {
    const group = taskGroups.find((g) => g.id === expandedCategoryId);
    if (!group) return [];
    let list = [...group.tasks];
    // status filter
    list = list.filter((t) => (folderStatusTab === 'completed' ? t.is_done : !t.is_done));
    // optional global filters (overdue/priority) if set
    if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
    if (filters.is_overdue) list = list.filter((t) => t.is_overdue);
    // sort
    if (folderSortBy === 'priority') {
      const rank = { low: 0, medium: 1, high: 2 };
      list.sort((a, b) => (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99));
      if (folderSortOrder === 'desc') list.reverse();
    } else if (folderSortBy === 'deadline') {
      const toTime = (d) => (d ? new Date(d).getTime() : Infinity);
      list.sort((a, b) => toTime(a.deadline) - toTime(b.deadline));
      if (folderSortOrder === 'desc') list.reverse();
    }
    return list;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-blue-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Title and Stats */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.total_tasks} всего • {stats.completed_tasks} выполнено • {stats.pending_tasks} в работе
                  {stats.overdue_tasks > 0 && (
                    <span className="text-red-600 ml-2">
                      • {stats.overdue_tasks} просрочено
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить задачу
              </button>
            </div>

            {/* Search and Controls (global) */}
            <div className="flex items-center justify-between space-x-4">
              {/* Search */}
              <div className="flex-1 max-w-lg relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Искать задачи..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-11 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm with-leading-icon"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Selection toggle */}
                <button
                  onClick={() => setSelectionMode((v) => !v)}
                  className={cn('btn-outline text-xs', selectionMode && 'bg-primary-50 border-primary-300 text-primary-700')}
                >
                  {selectionMode ? 'Режим выбора' : 'Выбрать'}
                </button>

                {/* AI Help */}
                <button
                  onClick={() => setShowAi(true)}
                  className="btn-outline flex items-center"
                  title="Помощь ИИ"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Помощь ИИ
                </button>

                {/* Bulk Actions */}
                {selectedTasks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{selectedTasks.length} выбрано</span>
                    <button
                      onClick={() => handleBulkAction('complete')}
                      className="btn-success text-xs"
                    >
                      Отметить выполнено
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="btn-danger text-xs"
                    >
                      Удалить
                    </button>
                  </div>
                )}

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "btn-outline flex items-center",
                    showFilters && "bg-primary-50 border-primary-300 text-primary-700"
                  )}
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Фильтры
                </button>

                {/* View Mode Toggle removed */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/70 backdrop-blur-sm border-b border-blue-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <TaskFilters />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Загрузка задач...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">
              {error.message || 'Произошла ошибка при загрузке задач'}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && taskGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {tasks.length === 0 ? 'Задач пока нет' : 'Нет задач, подходящих под фильтры'}
            </h3>
            <p className="mt-2 text-gray-600">
              {tasks.length === 0
                ? 'Начните с создания первой задачи'
                : 'Попробуйте изменить параметры поиска или фильтров'
              }
            </p>
            {tasks.length === 0 && (
              <button
                onClick={() => setShowTaskForm(true)}
                className="mt-4 btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать первую задачу
              </button>
            )}
          </div>
        )}

        {/* Category folders */}
        {!isLoading && !error && taskGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskGroups.map((group) => {
              const isExpanded = expandedCategoryId === group.id;
              const visibleTasks = isExpanded ? getExpandedVisibleTasks() : [];
              const groupTaskIds = visibleTasks.map((t) => t.id);
              const allSelectedInGroup = groupTaskIds.length > 0 && groupTaskIds.every((id) => selectedTasks.includes(id));

              const overdueCount = group.tasks.filter((t) => t.is_overdue && !t.is_done).length;
                // Склонение слова "задача" по количеству
                const getTaskWord = (count) => {
                const mod10 = count % 10;
                const mod100 = count % 100;
                if (mod10 === 1 && mod100 !== 11) return 'задача';
                if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи';
                return 'задач';
                };

                const Header = (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                  <span className="inline-block h-3 w-3 rounded-full mr-2" style={{ backgroundColor: group.color || '#93C5FD' }} />
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  {overdueCount > 0 && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">просрочено: {overdueCount}</span>
                  )}
                  </div>
                  <span className="text-xs text-gray-500">
                  {group.tasks.length} {getTaskWord(group.tasks.length)}
                  </span>
                </div>
                );

              if (!isExpanded) {
                return (
                  <div key={group.id} className="card p-4 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium cursor-pointer" onClick={() => setExpandedCategoryId(group.id)}>
                    {Header}
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
                      {group.tasks.slice(0, 5).map((t) => (
                        <li key={t.id} className="truncate">• {t.title}</li>
                      ))}
                      {group.tasks.length > 5 && (
                        <li className="text-xs text-gray-500">ещё {group.tasks.length - 5}…</li>
                      )}
                    </ul>
                  </div>
                );
              }

              // Expanded folder
              return (
                <div key={group.id} className="md:col-span-2 lg:col-span-3 card p-5 bg-white/70 backdrop-blur-sm border-blue-100/60">
                  <div className="flex items-center justify-between">
                    {Header}
                    <button className="btn-outline text-xs" onClick={() => setExpandedCategoryId(null)}>Свернуть</button>
                  </div>

                  {/* Folder-local controls */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm p-1">
                      <button
                        onClick={() => setFolderStatusTab('pending')}
                        className={cn('px-2.5 py-1.5 rounded-md transition', folderStatusTab === 'pending' ? 'bg-primary-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50')}
                        title="Невыполненные"
                      >
                        <ClockIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setFolderStatusTab('completed')}
                        className={cn('ml-1 px-2.5 py-1.5 rounded-md transition', folderStatusTab === 'completed' ? 'bg-primary-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50')}
                        title="Выполненные"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm p-1">
                      <button
                        onClick={() => { setFolderSortBy(''); setFolderSortOrder('asc'); }}
                        className={cn('px-2.5 py-1.5 rounded-md transition', !folderSortBy ? 'bg-gray-100 text-gray-700' : 'text-gray-700 hover:bg-gray-50')}
                        title="Без сортировки"
                      >
                        <MinusCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => { setFolderSortOrder(folderSortBy === 'priority' ? (folderSortOrder === 'asc' ? 'desc' : 'asc') : 'asc'); setFolderSortBy('priority'); }}
                        className={cn('ml-1 px-2.5 py-1.5 rounded-md transition flex items-center', folderSortBy === 'priority' ? 'bg-primary-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50')}
                        title={`По важности (${folderSortBy === 'priority' ? (folderSortOrder === 'asc' ? 'возр.' : 'убыв.') : ''})`}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        {folderSortBy === 'priority' && (<span className="ml-1 text-[10px]">{folderSortOrder === 'asc' ? '↑' : '↓'}</span>)}
                      </button>
                      <button
                        onClick={() => { setFolderSortOrder(folderSortBy === 'deadline' ? (folderSortOrder === 'asc' ? 'desc' : 'asc') : 'asc'); setFolderSortBy('deadline'); }}
                        className={cn('ml-1 px-2.5 py-1.5 rounded-md transition flex items-center', folderSortBy === 'deadline' ? 'bg-primary-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50')}
                        title={`По сроку (${folderSortBy === 'deadline' ? (folderSortOrder === 'asc' ? 'возр.' : 'убыв.') : ''})`}
                      >
                        <ClockIcon className="h-5 w-5" />
                        {folderSortBy === 'deadline' && (<span className="ml-1 text-[10px]">{folderSortOrder === 'asc' ? '↑' : '↓'}</span>)}
                      </button>
                    </div>
                  </div>

                  {/* Select all within folder */}
                  {selectionMode && visibleTasks.length > 0 && (
                    <div className="mt-4 flex items-center justify-between bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-blue-100/60">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allSelectedInGroup}
                          onChange={() => {
                            if (allSelectedInGroup) {
                              setSelectedTasks(selectedTasks.filter((id) => !groupTaskIds.includes(id)));
                            } else {
                              const set = new Set([...selectedTasks, ...groupTaskIds]);
                              setSelectedTasks(Array.from(set));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Выбрать все ({visibleTasks.length} задач)</span>
                      </label>
                      {selectedTasks.length > 0 && (
                        <span className="text-sm text-primary-600">{selectedTasks.filter((id) => groupTaskIds.includes(id)).length} выбрано</span>
                      )}
                    </div>
                  )}

                  {/* Tasks of folder */}
                  <div className="mt-4 space-y-3">
                    {visibleTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        viewMode={'list'}
                        selectionMode={selectionMode}
                        showCategory={false}
                        onEdit={() => handleEditTask(task)}
                        showToast={(toast) => setToast(toast)}
                      />
                    ))}
                    {visibleTasks.length === 0 && (
                      <div className="text-sm text-gray-600">Нет задач в соответствии с выбранными условиями</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={handleTaskFormClose}
          onSuccess={(message) => {
            setToast({ type: 'success', message });
            handleTaskFormClose();
          }}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* AI Chat */}
      {showAi && (
        <AiChatModal
          onClose={() => setShowAi(false)}
          onRefresh={async () => {
            try {
              await loadTasks();
              await loadCategories();
              await loadStats();
            } catch (_) {}
          }}
          onNotify={(t) => setToast(t)}
        />
      )}
    </div>
  );
};

export default TaskList;
