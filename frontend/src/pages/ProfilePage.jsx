import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { cn, validation } from '../utils/index.js';
import Toast from '../components/common/Toast.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { HomeIcon, Squares2X2Icon, TagIcon, UserIcon, ArrowRightOnRectangleIcon, PencilSquareIcon, EnvelopeIcon, KeyIcon, TrashIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, logout, updateProfile, changePassword, refreshUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [toast, setToast] = useState(null);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwdData, setPwdData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [changingPwd, setChangingPwd] = useState(false);

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

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const validateProfile = () => {
    const e = {};
    if (!validation.isRequired(profileData.first_name)) e.first_name = 'Введите имя';
    if (!validation.isRequired(profileData.last_name)) e.last_name = 'Введите фамилию';
    if (!validation.isRequired(profileData.username) || !validation.minLength(profileData.username, 3)) e.username = 'Логин должен быть не короче 3 символов';
    if (!validation.isValidEmail(profileData.email)) e.email = 'Введите корректный email';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();
    if (!validateProfile()) return;
    setSavingProfile(true);
    const res = await updateProfile(profileData);
    setSavingProfile(false);
    if (res.success) {
      setToast({ type: 'success', message: 'Профиль обновлён' });
      await refreshUser();
    } else {
      setToast({ type: 'error', message: res.message || 'Не удалось обновить профиль' });
      if (res.error && typeof res.error === 'object') {
        setProfileErrors((prev) => ({ ...prev, ...res.error }));
      }
    }
  };

  const validatePwd = () => {
    const e = {};
    if (!validation.isRequired(pwdData.old_password)) e.old_password = 'Введите текущий пароль';
    if (!validation.isValidPassword(pwdData.new_password)) e.new_password = 'Пароль от 8 символов';
    if (pwdData.new_password !== pwdData.new_password_confirm) e.new_password_confirm = 'Пароли не совпадают';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault?.();
    if (!validatePwd()) return;
    setChangingPwd(true);
    const res = await changePassword(pwdData);
    setChangingPwd(false);
    if (res.success) {
      setToast({ type: 'success', message: 'Пароль обновлён' });
      setPwdData({ old_password: '', new_password: '', new_password_confirm: '' });
      setPwdErrors({});
    } else {
      setToast({ type: 'error', message: res.message || 'Не удалось сменить пароль' });
      if (res.error && typeof res.error === 'object') setPwdErrors((prev) => ({ ...prev, ...res.error }));
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm('Вы уверены, что хотите навсегда удалить аккаунт? Это действие необратимо.');
    if (!ok) return;
    const res = await deleteAccount();
    if (res.success) {
      setToast({ type: 'success', message: 'Аккаунт удалён' });
      navigate('/login');
    } else {
      setToast({ type: 'error', message: res.error?.message || 'Не удалось удалить аккаунт' });
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-blue-100/60">
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

              <nav className="flex space-x-4">
                {navigation.map((item) => {
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

            {/* User */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors" title="Выйти">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
          {/* Left: profile card */}
          <div className="w-full lg:w-1/2 card bg-white/70 backdrop-blur-sm border-blue-100/60 p-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                <UserIcon className="h-7 w-7" />
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-semibold text-gray-900">Ваш профиль</h2>
                <p className="text-sm text-gray-600">Обновите личную информацию</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData((s) => ({ ...s, first_name: e.target.value }))}
                    className={cn('w-full', profileErrors.first_name && 'input-error')}
                    placeholder="Имя"
                  />
                  {profileErrors.first_name && <p className="text-error mt-1">{profileErrors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData((s) => ({ ...s, last_name: e.target.value }))}
                    className={cn('w-full', profileErrors.last_name && 'input-error')}
                    placeholder="Фамилия"
                  />
                  {profileErrors.last_name && <p className="text-error mt-1">{profileErrors.last_name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData((s) => ({ ...s, username: e.target.value }))}
                      className={cn('w-full with-leading-icon', profileErrors.username && 'input-error')}
                      placeholder="Логин"
                    />
                    <PencilSquareIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  {profileErrors.username && <p className="text-error mt-1">{profileErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((s) => ({ ...s, email: e.target.value }))}
                      className={cn('w-full with-leading-icon', profileErrors.email && 'input-error')}
                      placeholder="you@example.com"
                    />
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  {profileErrors.email && <p className="text-error mt-1">{profileErrors.email}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setProfileData({ first_name: user?.first_name||'', last_name: user?.last_name||'', username: user?.username||'', email: user?.email||'' })} className="btn-outline">Сбросить</button>
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? (<><LoadingSpinner size="sm" className="mr-2" />Сохранение...</>) : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: security card */}
          <div className="w-full lg:w-1/2 card bg-white/70 backdrop-blur-sm border-blue-100/60 p-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <KeyIcon className="h-7 w-7" />
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-semibold text-gray-900">Безопасность</h2>
                <p className="text-sm text-gray-600">Смена пароля</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleChangePassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                <input
                  type="password"
                  value={pwdData.old_password}
                  onChange={(e) => setPwdData((s) => ({ ...s, old_password: e.target.value }))}
                  className={cn('w-full', pwdErrors.old_password && 'input-error')}
                  placeholder="••••••••"
                />
                {pwdErrors.old_password && <p className="text-error mt-1">{pwdErrors.old_password}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                  <input
                    type="password"
                    value={pwdData.new_password}
                    onChange={(e) => setPwdData((s) => ({ ...s, new_password: e.target.value }))}
                    className={cn('w-full', pwdErrors.new_password && 'input-error')}
                    placeholder="••••••••"
                  />
                  {pwdErrors.new_password && <p className="text-error mt-1">{pwdErrors.new_password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Подтверждение</label>
                  <input
                    type="password"
                    value={pwdData.new_password_confirm}
                    onChange={(e) => setPwdData((s) => ({ ...s, new_password_confirm: e.target.value }))}
                    className={cn('w-full', pwdErrors.new_password_confirm && 'input-error')}
                    placeholder="••••••••"
                  />
                  {pwdErrors.new_password_confirm && <p className="text-error mt-1">{pwdErrors.new_password_confirm}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button type="submit" className="btn-primary" disabled={changingPwd}>
                  {changingPwd ? (<><LoadingSpinner size="sm" className="mr-2" />Сохранение...</>) : 'Обновить пароль'}
                </button>
              </div>
            </form>

            {/* Danger zone */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center text-white">
                  <ShieldExclamationIcon className="h-6 w-6" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Опасная зона</h3>
                  <p className="text-sm text-gray-600">Удаление аккаунта без возможности восстановления</p>
                </div>
              </div>
              <button onClick={handleDeleteAccount} className="btn-danger flex items-center">
                <TrashIcon className="h-5 w-5 mr-2" />Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ProfilePage;
