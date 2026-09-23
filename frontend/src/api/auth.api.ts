import axiosClient from './axios-client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MeResponse,
} from '../types/auth.types';
import type { ApiResponse } from '../types/api';

/**
 * Gọi API Đăng nhập
 */
export const loginApi = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = (await axiosClient.post('/auth/login', data)) as unknown as AuthResponse;
  return response;
};

/**
 * Gọi API Đăng ký tài khoản (Học viên hoặc Giảng viên)
 */
export const registerApi = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = (await axiosClient.post('/auth/register', data)) as unknown as AuthResponse;
  return response;
};

/**
 * Lấy thông tin tài khoản hiện tại (Protected)
 */
export const getMeApi = async (): Promise<MeResponse> => {
  const response = (await axiosClient.get('/auth/me')) as unknown as MeResponse;
  return response;
};

/**
 * Cấp lại Access Token mới
 */
export const refreshTokenApi = async (
  refreshToken: string
): Promise<ApiResponse<{ accessToken: string }>> => {
  const response = (await axiosClient.post('/auth/refresh-token', {
    refreshToken,
  })) as unknown as ApiResponse<{ accessToken: string }>;
  return response;
};
