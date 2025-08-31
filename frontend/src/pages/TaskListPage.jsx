import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TaskList from '../components/tasks/TaskList.jsx';
import {
  HomeIcon,
  Squares2X2Icon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../utils/index.js';

const TaskListPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  };

  const navigation = [
    { name: 'Панель', href: '/dashboard', icon: HomeIcon },
    { name: 'Задачи', href: '/tasks', icon: Squares2X2Icon },
    { name: 'Категории', href: '/categories', icon: TagIcon },
  ];

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-blue-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Navigation */}
            <div className="flex items-center space-x-3 sm:space-x-8">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">Todo Master</h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="hidden sm:flex space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu toggle */}
              <button
                type="button"
                className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100"
                aria-label="Открыть меню"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
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
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-white/90 backdrop-blur">
            <div className="px-4 py-3 space-y-2">
              <nav className="grid grid-cols-1 gap-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-2 text-xs text-gray-600">{user?.email}</div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <TaskList />
      </main>
    </div>
  );
};

export default TaskListPage;
