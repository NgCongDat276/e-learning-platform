import axiosClient from './axios-client';
import type {
  AdminOverviewResponse,
  CourseStatsQuery,
  CourseStatsResponse,
  LearningQualityQuery,
  LearningQualityResponse,
  LecturerStatsQuery,
  LecturerStatsResponse,
  TimeRangeQuery,
} from '../types/admin-stats.types';

export const getAdminOverviewStatsApi = async (
  params?: TimeRangeQuery
): Promise<AdminOverviewResponse> => {
  return (await axiosClient.get('/admin/stats/overview', {
    params,
  })) as unknown as AdminOverviewResponse;
};

export const getAdminCourseStatsApi = async (
  params?: CourseStatsQuery
): Promise<CourseStatsResponse> => {
  return (await axiosClient.get('/admin/stats/courses', {
    params,
  })) as unknown as CourseStatsResponse;
};

export const getAdminLecturerStatsApi = async (
  params?: LecturerStatsQuery
): Promise<LecturerStatsResponse> => {
  return (await axiosClient.get('/admin/stats/lecturers', {
    params,
  })) as unknown as LecturerStatsResponse;
};

export const getAdminLearningQualityStatsApi = async (
  params?: LearningQualityQuery
): Promise<LearningQualityResponse> => {
  return (await axiosClient.get('/admin/stats/learning-quality', {
    params,
  })) as unknown as LearningQualityResponse;
};
