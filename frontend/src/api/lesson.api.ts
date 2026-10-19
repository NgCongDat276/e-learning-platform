import axiosClient from './axios-client';
import type {
  LessonDetailResponse,
  LessonActionResponse,
  LessonsListResponse,
  CreateLessonRequest,
  UpdateLessonRequest,
  ReorderLessonsRequest,
} from '../types/lesson.types';
import type { ApiResponse } from '../types/api';

/**
 * 1. Tạo bài học mới trong chương
 */
export const createLessonApi = async (
  data: CreateLessonRequest
): Promise<LessonActionResponse> => {
  const response = (await axiosClient.post(
    '/lessons',
    data
  )) as unknown as LessonActionResponse;
  return response;
};

/**
 * 2. Lấy chi tiết bài học theo ID
 */
export const getLessonByIdApi = async (
  id: string
): Promise<LessonDetailResponse> => {
  const response = (await axiosClient.get(
    `/lessons/${id}`
  )) as unknown as LessonDetailResponse;
  return response;
};

/**
 * 3. Cập nhật bài học
 */
export const updateLessonApi = async (
  id: string,
  data: UpdateLessonRequest
): Promise<LessonActionResponse> => {
  const response = (await axiosClient.put(
    `/lessons/${id}`,
    data
  )) as unknown as LessonActionResponse;
  return response;
};

/**
 * 4. Sắp xếp lại thứ tự bài học trong một chương
 */
export const reorderLessonsApi = async (
  data: ReorderLessonsRequest
): Promise<LessonsListResponse> => {
  const response = (await axiosClient.patch(
    '/lessons/reorder',
    data
  )) as unknown as LessonsListResponse;
  return response;
};

/**
 * 5. Xóa bài học
 */
export const deleteLessonApi = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = (await axiosClient.delete(
    `/lessons/${id}`
  )) as unknown as ApiResponse<null>;
  return response;
};
