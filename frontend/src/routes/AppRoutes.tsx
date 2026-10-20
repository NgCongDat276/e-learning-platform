import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { ProfilePage } from '../pages/user/ProfilePage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { TeacherCoursesPage } from '../pages/teacher/TeacherCoursesPage';
import { CourseBuilderPage } from '../pages/teacher/CourseBuilderPage';
import { CourseStudentsPage } from '../pages/teacher/CourseStudentsPage';
import { CourseCatalogPage } from '../pages/course/CourseCatalogPage';
import { CourseDetailPage } from '../pages/course/CourseDetailPage';
import { LearningPage } from '../pages/learning/LearningPage';
import { MyCoursesPage } from '../pages/student/MyCoursesPage';
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { GuestRoute } from '../components/guards/GuestRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Public Course Catalog & Details wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
      </Route>

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
          <Route path="/my-courses" element={<MyCoursesPage />} />
        </Route>
        {/* Protected Student Learning Classroom (Full-screen Distraction-free Workspace) */}
        <Route path="/courses/:slug/learn" element={<LearningPage />} />
        <Route
          path="/courses/:slug/learn/:lessonId"
          element={<LearningPage />}
        />
      </Route>

      {/* Protected Teacher / Lecturer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['lecturer', 'admin']} />}>
        <Route element={<MainLayout />}>
          <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
          <Route
            path="/teacher/courses/:courseId/builder"
            element={<CourseBuilderPage />}
          />
          <Route
            path="/teacher/courses/:courseId/students"
            element={<CourseStudentsPage />}
          />
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
