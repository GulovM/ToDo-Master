import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, UserPlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { validation } from '../utils/index.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = () => {
      const password = formData.password;
      let strength = 0;
      
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/\d/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      setPasswordStrength(strength);
    };
    
    calculateStrength();
  }, [formData.password]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!validation.isRequired(formData.username)) {
      errors.username = 'Введите имя пользователя';
    } else if (!validation.minLength(formData.username, 3)) {
      errors.username = 'Имя пользователя должно быть не короче 3 символов';
    }

    if (!validation.isRequired(formData.email)) {
      errors.email = 'Введите email';
    } else if (!validation.isValidEmail(formData.email)) {
      errors.email = 'Введите корректный email';
    }

    if (!validation.isRequired(formData.firstName)) {
      errors.firstName = 'Введите имя';
    }

    if (!validation.isRequired(formData.lastName)) {
      errors.lastName = 'Введите фамилию';
    }

    if (!validation.isRequired(formData.password)) {
      errors.password = 'Введите пароль';
    } else if (!validation.isValidPassword(formData.password)) {
      errors.password = 'Пароль должен быть не короче 8 символов';
    }

    if (!validation.isRequired(formData.passwordConfirm)) {
      errors.passwordConfirm = 'Подтвердите пароль';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Пароли не совпадают';
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
      const registrationData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      };
      
      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        if (result.error && typeof result.error === 'object') {
          const apiErrors = {};
          const mapKey = (k) => ({
            first_name: 'firstName',
            last_name: 'lastName',
            password_confirm: 'passwordConfirm',
            password_confirmation: 'passwordConfirm',
          })[k] || k;

          Object.keys(result.error).forEach(key => {
            const mappedKey = mapKey(key);
            const value = result.error[key];
            apiErrors[mappedKey] = Array.isArray(value) ? value[0] : value;
          });
          setFormErrors(apiErrors);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength info
  const getPasswordStrengthInfo = () => {
    const strengthLevels = [
      { text: 'Очень слабый', color: 'bg-red-500', textColor: 'text-red-600' },
      { text: 'Слабый', color: 'bg-orange-500', textColor: 'text-orange-600' },
      { text: 'Средний', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      { text: 'Хороший', color: 'bg-blue-500', textColor: 'text-blue-600' },
      { text: 'Сильный', color: 'bg-green-500', textColor: 'text-green-600' },
    ];
    const idx = Math.min(passwordStrength, strengthLevels.length - 1);
    return strengthLevels[idx];
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-md">
              <div className="flex items-center mb-8">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <UserPlusIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="ml-4 text-2xl font-bold">Присоединяйтесь к Todo Master</h1>
              </div>
              
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Начните своё<br />
                <span className="text-blue-200">путешествие продуктивности</span>
              </h2>
              
              <p className="text-xl text-blue-100 mb-8">
                Присоединяйтесь к тысячам пользователей, которые улучшили свой рабочий день с нашей системой управления задачами.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-blue-300 mr-3" />
                  <span className="text-blue-100">Бесплатный план навсегда</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-300 mr-3" />
                  <span className="text-blue-100">Безопасно и конфиденциально</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-blue-300 mr-3" />
                  <span className="text-blue-100">Без привязки карты</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/3 right-16 w-24 h-24 bg-blue-300/20 rounded-full blur-lg"></div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl mb-4">
                <UserPlusIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Todo Master</h1>
            </div>

            {/* Form Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Создайте аккаунт</h2>
              <p className="text-gray-600">Начните организовывать свои задачи уже сегодня</p>
            </div>

            {/* Registration Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* API non-field errors */}
              {formErrors.non_field_errors && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="text-sm text-red-700">{formErrors.non_field_errors}</div>
                </div>
              )}
              <div className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Имя
                  </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.firstName ? 'border-red-300 focus:ring-red-500' : ''
                      }`}
                      placeholder="Имя"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {formErrors.firstName && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Фамилия
                  </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.lastName ? 'border-red-300 focus:ring-red-500' : ''
                      }`}
                      placeholder="Фамилия"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {formErrors.lastName && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Имя пользователя
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      formErrors.username ? 'border-red-300 focus:ring-red-500' : ''
                    }`}
                    placeholder="Выберите имя пользователя"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.username && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>

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
                      autoComplete="new-password"
                      required
                      className={`block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.password ? 'border-red-300 focus:ring-red-500' : ''
                      }`}
                      placeholder="Придумайте пароль"
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                            style={{ width: `${(Math.min(passwordStrength, 5) / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${strengthInfo.textColor}`}>
                          {strengthInfo.text}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {formErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className={`block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.passwordConfirm ? 'border-red-300 focus:ring-red-500' : ''
                      }`}
                      placeholder="Подтвердите пароль"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      disabled={isSubmitting}
                    >
                      {showPasswordConfirm ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                  {formErrors.passwordConfirm && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.passwordConfirm}</p>
                  )}
                </div>
              </div>

              {/* Terms Agreement removed */}

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
                      Создание аккаунта...
                    </>
                  ) : (
                    'Создать аккаунт'
                  )}
                </button>
              </div>
            </form>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Уже есть аккаунт?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
