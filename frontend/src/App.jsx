import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { TaskProvider } from './context/TaskContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskListPage from './pages/TaskListPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

function AppRoutes() {
  const location = useLocation();
  return (
    // Key Routes by pathname to force remount on path change
    <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <TaskListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
