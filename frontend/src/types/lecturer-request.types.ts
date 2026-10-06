import type { UserRole } from './auth.types';
import type { ApiResponse, PaginationMeta } from './api';

export type LecturerRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Thông tin ứng viên xin làm giảng viên
 */
export interface CandidateProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  degree: string | null;
  expertise: string | null;
  bio: string | null;
  certificates: string | null;
  cv_url: string | null;
}

/**
 * Thông tin Admin đã duyệt
 */
export interface ReviewerInfo {
  id: string;
  full_name: string;
  email: string;
}

/**
 * Đối tượng đơn xin làm giảng viên
 */
export interface LecturerRequest {
  id: string;
  user_id: string;
  status: LecturerRequestStatus;
  note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  candidate: CandidateProfile;
  reviewer: ReviewerInfo | null;
}

/**
 * Dữ liệu thống kê số lượng đơn theo trạng thái
 */
export interface LecturerRequestsStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

/**
 * Query params khi tìm kiếm & lọc đơn
 */
export interface LecturerRequestsQuery {
  page?: number;
  limit?: number;
  status?: LecturerRequestStatus | 'all';
  search?: string;
}

/**
 * Payload khi Admin duyệt hoặc từ chối đơn
 */
export interface ReviewLecturerRequestPayload {
  status: 'approved' | 'rejected';
  note?: string;
}

/**
 * Cấu trúc danh sách trả về kèm phân trang
 */
export interface LecturerRequestsData {
  items: LecturerRequest[];
  pagination: PaginationMeta;
}

export type LecturerRequestsListResponse = ApiResponse<LecturerRequestsData>;
export type LecturerRequestsStatsResponse = ApiResponse<LecturerRequestsStats>;
export type ReviewLecturerRequestResponse = ApiResponse<LecturerRequest>;
