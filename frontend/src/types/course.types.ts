import type { ApiResponse } from './api';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'hidden';

export interface CourseLecturer {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string;
  teacher_profile?: {
    degree?: string | null;
    expertise?: string | null;
    bio?: string | null;
  } | null;
}

export interface CourseCount {
  enrollments?: number;
  chapters?: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  lesson_type: 'video' | 'quiz' | 'text';
  duration_seconds?: number | null;
  order_index: number;
  created_at?: string;
}

export interface ChapterSummary {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  lessons: LessonSummary[];
}

export interface CourseSummaryStats {
  totalChapters: number;
  totalLessons: number;
  totalDurationSeconds: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  price: number | string;
  level: CourseLevel;
  status: CourseStatus;
  created_at?: string;
  updated_at?: string;
  lecturer_id?: string;
  users?: CourseLecturer;
  _count?: CourseCount;
}

export interface CourseDetail extends Course {
  chapters: ChapterSummary[];
  summary: CourseSummaryStats;
}

export interface CreateCourseRequest {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  price: number;
  level: CourseLevel;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  price?: number;
  level?: CourseLevel;
}

export interface UpdateCourseStatusRequest {
  status: CourseStatus;
}

export interface CoursesListQuery {
  page?: number;
  limit?: number;
  search?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  lecturer_id?: string;
  sort?: 'latest' | 'oldest' | 'price_asc' | 'price_desc';
}

export type CoursesListResponse = ApiResponse<Course[]>;
export type CourseDetailResponse = ApiResponse<CourseDetail>;
export type CourseActionResponse = ApiResponse<Course>;
