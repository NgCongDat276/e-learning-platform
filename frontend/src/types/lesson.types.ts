import type { ApiResponse } from './api';

export type LessonType = 'video' | 'quiz' | 'text';

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  lesson_type: LessonType;
  content_url?: string | null;
  lesson_content?: string | null;
  duration_seconds?: number | null;
  order_index: number;
  created_at?: string;
  chapters?: {
    id: string;
    title: string;
    course_id: string;
    courses?: {
      id: string;
      title: string;
      lecturer_id: string;
      status: string;
    };
  };
}

export interface CreateLessonRequest {
  chapter_id: string;
  title: string;
  lesson_type: LessonType;
  content_url?: string | null;
  lesson_content?: string | null;
  duration_seconds?: number;
  order_index?: number;
}

export interface UpdateLessonRequest {
  title?: string;
  lesson_type?: LessonType;
  content_url?: string | null;
  lesson_content?: string | null;
  duration_seconds?: number;
}

export interface ReorderLessonItem {
  id: string;
  order_index: number;
}

export interface ReorderLessonsRequest {
  chapter_id: string;
  items: ReorderLessonItem[];
}

export type LessonDetailResponse = ApiResponse<Lesson>;
export type LessonsListResponse = ApiResponse<Lesson[]>;
export type LessonActionResponse = ApiResponse<Lesson>;
