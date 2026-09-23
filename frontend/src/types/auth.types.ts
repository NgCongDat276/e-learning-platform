import type { ApiResponse } from './api';

export type UserRole = 'student' | 'lecturer' | 'admin';

export interface TeacherProfile {
  degree?: string | null;
  expertise?: string | null;
  bio?: string | null;
  certificates?: string | null;
  cv_url?: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  teacher_profile?: TeacherProfile | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'lecturer';
  // Các trường bổ sung của Giảng viên
  degree?: string;
  expertise?: string;
  bio?: string;
  certificates?: string;
  cv_url?: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type AuthResponse = ApiResponse<AuthResponseData>;
export type MeResponse = ApiResponse<User>;
