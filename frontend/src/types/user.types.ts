import type { ApiResponse } from './api';
import type { User, UserRole } from './auth.types';

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string | null;
  degree?: string | null;
  expertise?: string | null;
  bio?: string | null;
  certificates?: string | null;
  cv_url?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UsersListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

export type ProfileResponse = ApiResponse<User>;
export type UsersListResponse = ApiResponse<User[]>;
