import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTasks } from '../context/TaskContext.jsx';
import { cn } from '../utils/index.js';
import { HomeIcon, Squares2X2Icon, TagIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import heroImg from '../../icon_to_do.png';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { stats, loadStats } = useTasks();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const quote = useMemo(() => {
    const quotes = [
      'Самая большая ошибка — ничегo не делать, потому что можешь сделать лишь немного.',
      'Дисциплина сильнее мотивации. Маленькие шаги — каждый день.',
      'Секрет продвижения — начать. Секрет начала — разбить цель на шаги.',
      'Сделай сегодня то, что другие не хотят, и завтра будешь жить так, как другие не могут.',
      'Идеальных условий не будет. Начни с того, что есть.',
    ];
    const idx = new Date().getDate() % quotes.length;
    return quotes[idx];
  }, []);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-16 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
      </div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">Todo Master</h1>
              </div>

              {/* Navigation Menu */}
              <nav className="flex space-x-4">
                {[
                  { name: 'Панель', href: '/dashboard', icon: HomeIcon },
                  { name: 'Задачи', href: '/tasks', icon: Squares2X2Icon },
                  { name: 'Категории', href: '/categories', icon: TagIcon },
                ].map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                title="Профиль"
              >
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                title="Выйти"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <div className="text-sm text-gray-600">Всего задач</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.total_tasks}</div>
            </div>
            <div className="card p-4 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <div className="text-sm text-gray-600">Выполнено</div>
              <div className="text-2xl font-semibold text-green-600">{stats.completed_tasks}</div>
            </div>
            <div className="card p-4 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <div className="text-sm text-gray-600">В работе</div>
              <div className="text-2xl font-semibold text-amber-600">{stats.pending_tasks}</div>
            </div>
            <div className="card p-4 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <div className="text-sm text-gray-600">Просрочено</div>
              <div className="text-2xl font-semibold text-red-600">{stats.overdue_tasks}</div>
            </div>
          </div>

          {/* Хиро блок */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-start">
                <img src={heroImg} alt="Иллюстрация" className="hidden sm:block w-28 h-28 mr-4 rounded-xl shadow-sm" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Добро пожаловать, {user?.first_name || user?.username}!</h3>
                  <p className="text-gray-700 mb-3">Сегодня отличный день, чтобы сделать ещё один шаг к своим целям. Начните с малого — добавьте одну задачу и выполните её.</p>
                  <p className="text-gray-600 italic">«{quote}»</p>
                  <div className="mt-4 flex items-center space-x-3">
                    <Link
                      to="/tasks"
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Squares2X2Icon className="h-5 w-5 mr-2 text-white" />
                      Перейти к задачам
                    </Link>
                    <Link
                      to="/categories"
                      className="inline-flex items-center px-5 py-3 rounded-xl border border-indigo-200 bg-white text-indigo-700 shadow hover:bg-indigo-50 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      <TagIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Управлять категориями
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Сводка */}
            <div className="card p-6 bg-white/70 backdrop-blur-sm border-indigo-100/60 hover:shadow-medium transition">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Сводка за неделю</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Создано задач: <span className="font-medium">{Math.max(stats.completed_tasks + stats.pending_tasks - 0, 0)}</span></li>
                <li>• Завершено: <span className="font-medium text-green-700">{stats.completed_tasks}</span></li>
                <li>• В работе: <span className="font-medium text-amber-700">{stats.pending_tasks}</span></li>
                <li>• Просрочено: <span className="font-medium text-red-700">{stats.overdue_tasks}</span></li>
              </ul>
              <div className="mt-4 text-xs text-gray-500">Совет: вносите дедлайны — это помогает держать фокус.</div>
            </div>
          </div>

          {/* Советы по продуктивности */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <h4 className="font-semibold text-gray-900 mb-1">Правило 2 минут</h4>
              <p className="text-sm text-gray-700">Если задача занимает меньше 2 минут — сделайте её сразу.</p>
            </div>
            <div className="card p-5 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <h4 className="font-semibold text-gray-900 mb-1">Разбейте крупное</h4>
              <p className="text-sm text-gray-700">Делите большие задачи на понятные шаги и фиксируйте дедлайны.</p>
            </div>
            <div className="card p-5 bg-white/70 backdrop-blur-sm border-blue-100/60 hover:shadow-medium transition">
              <h4 className="font-semibold text-gray-900 mb-1">Ежедневный обзор</h4>
              <p className="text-sm text-gray-700">Проверяйте список в начале дня и отмечайте приоритеты.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
