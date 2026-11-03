import type { ApiResponse } from './api';
import type { UserRole } from './auth.types';

export interface CommentAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole | null;
  is_course_lecturer: boolean;
}

export interface LessonCommentItem {
  id: string;
  lesson_id: string;
  parent_comment_id: string | null;
  content: string;
  status: 'approved' | 'pending' | 'rejected' | null;
  created_at: string;
  updated_at: string;
  user: CommentAuthor;
  replies: LessonCommentItem[];
}

export interface LessonCommentsData {
  items: LessonCommentItem[];
  total_comments: number;
  course_lecturer_id: string;
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string | null;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface DeleteCommentData {
  deleted_id: string;
  parent_comment_id: string | null;
}

export type LessonCommentsResponse = ApiResponse<LessonCommentsData>;
export type SingleCommentResponse = ApiResponse<LessonCommentItem>;
export type DeleteCommentResponse = ApiResponse<DeleteCommentData>;

