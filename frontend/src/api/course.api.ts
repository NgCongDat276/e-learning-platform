import axiosClient from './axios-client';
import type {
  CoursesListQuery,
  CoursesListResponse,
  CourseDetailResponse,
  CourseActionResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  UpdateCourseStatusRequest,
} from '../types/course.types';
import type { ApiResponse } from '../types/api';

/**
 * 1. Lấy danh sách khóa học công khai cho học viên (Public Catalog)
 */
export const getCoursesListApi = async (
  params?: CoursesListQuery
): Promise<CoursesListResponse> => {
  const response = (await axiosClient.get('/courses', {
    params,
  })) as unknown as CoursesListResponse;
  return response;
};

/**
 * 2. Lấy danh sách khóa học do Giảng viên phụ trách (Teaching Workspace)
 */
export const getMyTeachingCoursesApi = async (
  params?: CoursesListQuery
): Promise<CoursesListResponse> => {
  const response = (await axiosClient.get('/courses/teaching/me', {
    params,
  })) as unknown as CoursesListResponse;
  return response;
};

/**
 * 3. Lấy thông tin chi tiết một khóa học theo slug (kèm cấu trúc chương & bài học)
 */
export const getCourseBySlugApi = async (
  slug: string
): Promise<CourseDetailResponse> => {
  const response = (await axiosClient.get(
    `/courses/${slug}`
  )) as unknown as CourseDetailResponse;
  return response;
};

/**
 * 4. Tạo khóa học mới (Giảng viên / Admin)
 */
export const createCourseApi = async (
  data: CreateCourseRequest
): Promise<CourseActionResponse> => {
  const response = (await axiosClient.post(
    '/courses',
    data
  )) as unknown as CourseActionResponse;
  return response;
};

/**
 * 5. Cập nhật thông tin khóa học (Tác giả / Admin)
 */
export const updateCourseApi = async (
  id: string,
  data: UpdateCourseRequest
): Promise<CourseActionResponse> => {
  const response = (await axiosClient.put(
    `/courses/${id}`,
    data
  )) as unknown as CourseActionResponse;
  return response;
};

/**
 * 6. Bật / Tắt trạng thái xuất bản khóa học (draft / published / hidden)
 */
export const updateCourseStatusApi = async (
  id: string,
  data: UpdateCourseStatusRequest
): Promise<CourseActionResponse> => {
  const response = (await axiosClient.patch(
    `/courses/${id}/status`,
    data
  )) as unknown as CourseActionResponse;
  return response;
};

/**
 * 7. Xóa khóa học khi chưa có học viên đăng ký (Tác giả / Admin)
 */
export const deleteCourseApi = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = (await axiosClient.delete(
    `/courses/${id}`
  )) as unknown as ApiResponse<null>;
  return response;
};
