import axiosClient from './axios-client';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UsersListQuery,
  ProfileResponse,
  UsersListResponse,
} from '../types/user.types';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/auth.types';

/**
 * 1. Lấy thông tin cá nhân chi tiết (Protected)
 */
export const getProfileApi = async (): Promise<ProfileResponse> => {
  const response = (await axiosClient.get('/users/profile')) as unknown as ProfileResponse;
  return response;
};

/**
 * 2. Cập nhật thông tin cá nhân & chuyên môn giảng viên (Protected)
 */
export const updateProfileApi = async (
  data: UpdateProfileRequest
): Promise<ProfileResponse> => {
  const response = (await axiosClient.put('/users/profile', data)) as unknown as ProfileResponse;
  return response;
};

/**
 * 3. Đổi mật khẩu tài khoản (Protected)
 */
export const changePasswordApi = async (
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> => {
  const response = (await axiosClient.put(
    '/users/change-password',
    data
  )) as unknown as ApiResponse<null>;
  return response;
};

/**
 * 4. Lấy danh sách người dùng cho Admin (Protected: Admin)
 */
export const getUsersListApi = async (
  params?: UsersListQuery
): Promise<UsersListResponse> => {
  const response = (await axiosClient.get('/users', {
    params,
  })) as unknown as UsersListResponse;
  return response;
};

/**
 * 5. Khóa hoặc kích hoạt tài khoản người dùng (Protected: Admin)
 */
export const updateUserStatusApi = async (
  userId: string,
  isActive: boolean
): Promise<ApiResponse<User>> => {
  const response = (await axiosClient.patch(`/users/${userId}/status`, {
    is_active: isActive,
  })) as unknown as ApiResponse<User>;
  return response;
};
