import axiosClient from './axios-client';
import type {
  EnrollResponse,
  EnrollmentStatusResponse,
  MyEnrolledCoursesResponse,
  ClassroomDataResponse,
  CourseStudentsResponse,
  CompleteLessonResponse,
  UncompleteLessonResponse,
} from '../types/enrollment.types';
import type { ApiResponse } from '../types/api';

/**
 * 1. Học viên ghi danh khóa học
 */
export const enrollCourseApi = async (
  courseIdOrSlug: string
): Promise<EnrollResponse> => {
  const response = (await axiosClient.post(
    `/enrollments/courses/${courseIdOrSlug}/enroll`
  )) as unknown as EnrollResponse;
  return response;
};

/**
 * 2. Lấy trạng thái ghi danh của học viên trong một khóa học
 */
export const getEnrollmentStatusApi = async (
  courseIdOrSlug: string
): Promise<EnrollmentStatusResponse> => {
  const response = (await axiosClient.get(
    `/enrollments/courses/${courseIdOrSlug}/status`
  )) as unknown as EnrollmentStatusResponse;
  return response;
};

/**
 * 3. Lấy danh sách khóa học mà học viên đã ghi danh
 */
export const getMyEnrolledCoursesApi = async (): Promise<MyEnrolledCoursesResponse> => {
  const response = (await axiosClient.get(
    '/enrollments/my-courses'
  )) as unknown as MyEnrolledCoursesResponse;
  return response;
};

/**
 * 4. Lấy cây dữ liệu chương và bài học cho phòng học tập trung
 */
export const getClassroomDataApi = async (
  courseIdOrSlug: string
): Promise<ClassroomDataResponse> => {
  const response = (await axiosClient.get(
    `/enrollments/courses/${courseIdOrSlug}/classroom`
  )) as unknown as ClassroomDataResponse;
  return response;
};

/**
 * 5. Đánh dấu bài học đã hoàn thành
 */
export const completeLessonApi = async (
  lessonId: string
): Promise<CompleteLessonResponse> => {
  const response = (await axiosClient.post(
    `/enrollments/lessons/${lessonId}/complete`
  )) as unknown as CompleteLessonResponse;
  return response;
};

/**
 * 6. Hủy đánh dấu hoàn thành bài học
 */
export const uncompleteLessonApi = async (
  lessonId: string
): Promise<UncompleteLessonResponse> => {
  const response = (await axiosClient.delete(
    `/enrollments/lessons/${lessonId}/complete`
  )) as unknown as UncompleteLessonResponse;
  return response;
};

/**
 * 7. Cập nhật vị trí xem video (giây)
 */
export const updateLessonProgressApi = async (
  lessonId: string,
  lastWatchedPosition: number
): Promise<ApiResponse<{ success: boolean; lessonId: string; last_watched_position: number }>> => {
  const response = (await axiosClient.patch(
    `/enrollments/lessons/${lessonId}/progress`,
    { last_watched_position: lastWatchedPosition }
  )) as unknown as ApiResponse<{
    success: boolean;
    lessonId: string;
    last_watched_position: number;
  }>;
  return response;
};

/**
 * 8. Giảng viên xem danh sách học viên và tiến độ học tập
 */
export const getCourseStudentsApi = async (
  courseIdOrSlug: string
): Promise<CourseStudentsResponse> => {
  const response = (await axiosClient.get(
    `/enrollments/courses/${courseIdOrSlug}/students`
  )) as unknown as CourseStudentsResponse;
  return response;
};
