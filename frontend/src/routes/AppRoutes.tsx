import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { GuestRoute } from '../components/guards/GuestRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Guest-only Auth Routes (redirects logged-in users away from login/register) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Protected Routes (Ready for Module 2) */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/profile"
          element={
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <h2>User Profile (Coming Soon in Module 2)</h2>
            </div>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
