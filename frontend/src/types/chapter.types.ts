import type { ApiResponse } from './api';
import type { LessonSummary } from './course.types';

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  lessons?: LessonSummary[];
}

export interface CreateChapterRequest {
  course_id: string;
  title: string;
  order_index?: number;
}

export interface UpdateChapterRequest {
  title: string;
}

export interface ReorderChapterItem {
  id: string;
  order_index: number;
}

export interface ReorderChaptersRequest {
  course_id: string;
  items: ReorderChapterItem[];
}

export type ChaptersListResponse = ApiResponse<Chapter[]>;
export type ChapterActionResponse = ApiResponse<Chapter>;
