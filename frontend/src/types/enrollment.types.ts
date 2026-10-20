import type { ApiResponse } from './api';
import type { LessonType } from './lesson.types';

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface EnrollCourseResult {
  enrollment: Enrollment;
  courseId: string;
  courseSlug: string;
  firstLessonId: string | null;
}

export interface EnrollmentStatusResult {
  isEnrolled: boolean;
  isAuthor: boolean;
  status: EnrollmentStatus | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  firstLessonId: string | null;
}

export interface MyEnrolledCourse {
  id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
    level?: string | null;
    instructor?: {
      id: string;
      full_name: string;
      avatar_url?: string | null;
    } | null;
  };
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface ClassroomLesson {
  id: string;
  chapter_id: string;
  title: string;
  lesson_type: LessonType;
  content_url?: string | null;
  lesson_content?: string | null;
  duration_seconds?: number | null;
  order_index: number;
  is_completed: boolean;
  last_watched_position: number;
}

export interface ClassroomChapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  lessons: ClassroomLesson[];
}

export interface ClassroomData {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
  };
  chapters: ClassroomChapter[];
  progress: {
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    nextLessonId: string | null;
  };
}

export interface CourseStudentItem {
  enrollmentId: string;
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };
  enrolledAt: string;
  status: EnrollmentStatus;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastActivityAt: string;
}

export interface CourseStudentsResult {
  course: {
    id: string;
    title: string;
    slug: string;
  };
  totalStudents: number;
  students: CourseStudentItem[];
}

// API Responses
export type EnrollResponse = ApiResponse<EnrollCourseResult>;
export type EnrollmentStatusResponse = ApiResponse<EnrollmentStatusResult>;
export type MyEnrolledCoursesResponse = ApiResponse<MyEnrolledCourse[]>;
export type ClassroomDataResponse = ApiResponse<ClassroomData>;
export type CourseStudentsResponse = ApiResponse<CourseStudentsResult>;
export type CompleteLessonResponse = ApiResponse<{
  success: boolean;
  lessonId: string;
  is_completed: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}>;
export type UncompleteLessonResponse = ApiResponse<{
  success: boolean;
  lessonId: string;
  is_completed: boolean;
}>;
