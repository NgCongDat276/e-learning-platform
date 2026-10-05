import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { ProfilePage } from '../pages/user/ProfilePage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { GuestRoute } from '../components/guards/GuestRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Guest-only Auth Routes */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Protected User Routes wrapped in MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
