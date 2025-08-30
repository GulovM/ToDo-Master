import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, clearError, isAuthenticated, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Введите email';
    }

    if (!formData.password) {
      errors.password = 'Введите пароль';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });
      
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        if (result.error && typeof result.error === 'object') {
          setFormErrors(result.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-md">
              <div className="flex items-center mb-8">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="ml-4 text-2xl font-bold">Todo Master</h1>
              </div>
              
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Организуйте свою жизнь,<br />
                <span className="text-blue-200">по одной задаче за раз</span>
              </h2>
              
              <p className="text-xl text-blue-100 mb-8">
                Самый простой способ управлять задачами и повышать продуктивность.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-blue-300 rounded-full mr-3"></div>
                  <span className="text-blue-100">Умная организация задач</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-blue-300 rounded-full mr-3"></div>
                  <span className="text-blue-100">Сортировка по приоритетам</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-blue-300 rounded-full mr-3"></div>
                  <span className="text-blue-100">Отслеживание дедлайнов</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/4 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/4 right-20 w-20 h-20 bg-blue-300/20 rounded-full blur-lg"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl mb-4">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Todo Master</h1>
            </div>

            {/* Form Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">С возвращением</h2>
              <p className="text-gray-600">Пожалуйста, войдите в свой аккаунт</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    {error.message || 'Ошибка входа. Проверьте введённые данные.'}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {formErrors.non_field_errors && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="text-sm text-red-700">{formErrors.non_field_errors}</div>
                </div>
              )}
              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      formErrors.email ? 'border-red-300 focus:ring-red-500' : ''
                    }`}
                    placeholder="Введите email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className={`block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.password ? 'border-red-300 focus:ring-red-500' : ''
                      }`}
                      placeholder="Введите пароль"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Запомнить меня
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Забыли пароль?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Вход...
                    </>
                  ) : (
                    'Войти в аккаунт'
                  )}
                </button>
              </div>
            </form>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Создать
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
