import axiosClient from './axios-client';
import type {
  LessonCommentsResponse,
  SingleCommentResponse,
  DeleteCommentResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '../types/comment.types';

/**
 * 1. Lấy danh sách bình luận theo bài học (phân trang các bình luận gốc, kèm replies)
 */
export const getLessonCommentsApi = async (
  lessonId: string,
  page: number = 1,
  limit: number = 20
): Promise<LessonCommentsResponse> => {
  const response = (await axiosClient.get(`/comments/lessons/${lessonId}`, {
    params: { page, limit },
  })) as unknown as LessonCommentsResponse;
  return response;
};

/**
 * 2. Đăng bình luận mới hoặc trả lời bình luận trong bài học
 */
export const createLessonCommentApi = async (
  lessonId: string,
  data: CreateCommentRequest
): Promise<SingleCommentResponse> => {
  const response = (await axiosClient.post(
    `/comments/lessons/${lessonId}`,
    data
  )) as unknown as SingleCommentResponse;
  return response;
};

/**
 * 3. Chỉnh sửa nội dung bình luận của chính mình
 */
export const updateCommentApi = async (
  commentId: string,
  data: UpdateCommentRequest
): Promise<SingleCommentResponse> => {
  const response = (await axiosClient.patch(
    `/comments/${commentId}`,
    data
  )) as unknown as SingleCommentResponse;
  return response;
};

/**
 * 4. Xóa bình luận (Tác giả / Giảng viên phụ trách khóa học / Admin)
 */
export const deleteCommentApi = async (
  commentId: string
): Promise<DeleteCommentResponse> => {
  const response = (await axiosClient.delete(
    `/comments/${commentId}`
  )) as unknown as DeleteCommentResponse;
  return response;
};

