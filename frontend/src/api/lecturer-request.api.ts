import axiosClient from './axios-client';
import type {
  LecturerRequestsQuery,
  LecturerRequestsListResponse,
  LecturerRequestsStatsResponse,
  ReviewLecturerRequestPayload,
  ReviewLecturerRequestResponse,
} from '../types/lecturer-request.types';

/**
 * 1. Lấy danh sách các đơn đăng ký làm giảng viên (Protected: Admin)
 */
export const getLecturerRequestsApi = async (
  params?: LecturerRequestsQuery
): Promise<LecturerRequestsListResponse> => {
  const response = (await axiosClient.get('/lecturer-requests', {
    params,
  })) as unknown as LecturerRequestsListResponse;
  return response;
};

/**
 * 2. Lấy thống kê số lượng đơn theo trạng thái (Protected: Admin)
 * Phục vụ hiển thị Badge số lượng đơn đang chờ duyệt trên UI
 */
export const getLecturerRequestsStatsApi = async (): Promise<LecturerRequestsStatsResponse> => {
  const response = (await axiosClient.get(
    '/lecturer-requests/stats'
  )) as unknown as LecturerRequestsStatsResponse;
  return response;
};

/**
 * 3. Phê duyệt hoặc từ chối đơn đăng ký làm giảng viên (Protected: Admin)
 */
export const reviewLecturerRequestApi = async (
  requestId: string,
  payload: ReviewLecturerRequestPayload
): Promise<ReviewLecturerRequestResponse> => {
  const response = (await axiosClient.patch(
    `/lecturer-requests/${requestId}/review`,
    payload
  )) as unknown as ReviewLecturerRequestResponse;
  return response;
};
