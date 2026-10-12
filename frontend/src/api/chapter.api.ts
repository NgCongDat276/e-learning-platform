import axiosClient from './axios-client';
import type {
  ChaptersListResponse,
  ChapterActionResponse,
  CreateChapterRequest,
  UpdateChapterRequest,
  ReorderChaptersRequest,
} from '../types/chapter.types';
import type { ApiResponse } from '../types/api';

/**
 * 1. Lấy danh sách chương và bài học của khóa học (Course Builder)
 */
export const getChaptersByCourseApi = async (
  courseId: string
): Promise<ChaptersListResponse> => {
  const response = (await axiosClient.get(
    `/chapters/course/${courseId}`
  )) as unknown as ChaptersListResponse;
  return response;
};

/**
 * 2. Tạo chương học mới
 */
export const createChapterApi = async (
  data: CreateChapterRequest
): Promise<ChapterActionResponse> => {
  const response = (await axiosClient.post(
    '/chapters',
    data
  )) as unknown as ChapterActionResponse;
  return response;
};

/**
 * 3. Cập nhật tiêu đề chương học
 */
export const updateChapterApi = async (
  id: string,
  data: UpdateChapterRequest
): Promise<ChapterActionResponse> => {
  const response = (await axiosClient.put(
    `/chapters/${id}`,
    data
  )) as unknown as ChapterActionResponse;
  return response;
};

/**
 * 4. Sắp xếp lại thứ tự các chương học trong khóa học
 */
export const reorderChaptersApi = async (
  data: ReorderChaptersRequest
): Promise<ChaptersListResponse> => {
  const response = (await axiosClient.patch(
    '/chapters/reorder',
    data
  )) as unknown as ChaptersListResponse;
  return response;
};

/**
 * 5. Xóa chương học
 */
export const deleteChapterApi = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = (await axiosClient.delete(
    `/chapters/${id}`
  )) as unknown as ApiResponse<null>;
  return response;
};
