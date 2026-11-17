import type { ApiResponse, PaginationMeta } from './api';

export interface TimeRangeQuery {
  fromTime?: string;
  toTime?: string;
}

export type StatsGranularity = 'hour' | 'day' | 'week' | 'month';

export interface AdminOverviewData {
  range: {
    fromTime: string;
    toTime: string;
    previousFromTime: string;
    previousToTime: string;
    granularity: StatsGranularity;
  };
  kpis: {
    users: {
      total: number;
      newInPeriod: number;
      prevNewInPeriod: number;
      growthPercent: number | null;
      byRole: {
        student: number;
        lecturer: number;
        admin: number;
      };
    };
    courses: {
      total: number;
      newInPeriod: number;
      byStatus: {
        published: number;
        draft: number;
        hidden: number;
      };
      byLevel: {
        beginner: number;
        intermediate: number;
        advanced: number;
      };
    };
    enrollments: {
      totalInPeriod: number;
      prevTotalInPeriod: number;
      growthPercent: number | null;
      totalAllTime: number;
      completedAllTime: number;
      cancelledAllTime: number;
      completionRate: number;
    };
    estimatedRevenue: {
      inPeriod: number;
      prevInPeriod: number;
      growthPercent: number | null;
      paidEnrollmentsInPeriod: number;
    };
    pendingActions: {
      lecturerRequests: number;
      comments: number;
      total: number;
    };
  };
  trend: Array<{
    bucket: string;
    label: string;
    newUsers: number;
    newEnrollments: number;
    estimatedRevenue: number;
  }>;
  recentPendingRequests: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    note: string | null;
    createdAt: string | null;
  }>;
}

export interface CourseStatsQuery extends TimeRangeQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'hidden';
  level?: 'beginner' | 'intermediate' | 'advanced';
  sortBy?:
    | 'enrollmentsInPeriod'
    | 'totalEnrollments'
    | 'estimatedRevenue'
    | 'completionRate'
    | 'commentsCount'
    | 'price'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CourseStatsItem {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'hidden' | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  price: number;
  createdAt: string | null;
  lecturerId: string;
  lecturerName: string;
  enrollmentsInPeriod: number;
  totalEnrollments: number;
  completedEnrollments: number;
  estimatedRevenue: number;
  completionRate: number;
  commentsCount: number;
}

export interface LecturerStatsQuery extends TimeRangeQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?:
    | 'enrollmentsInPeriod'
    | 'totalStudents'
    | 'publishedCourses'
    | 'estimatedRevenue'
    | 'completionRate';
  sortOrder?: 'asc' | 'desc';
}

export interface LecturerStatsItem {
  id: string;
  fullName: string;
  email: string;
  expertise: string | null;
  totalCourses: number;
  publishedCourses: number;
  enrollmentsInPeriod: number;
  totalStudents: number;
  estimatedRevenue: number;
  completionRate: number;
}

export interface LearningQualityQuery extends TimeRangeQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'attemptsInPeriod' | 'passRate' | 'averageScore';
  sortOrder?: 'asc' | 'desc';
}

export interface QuizQualityItem {
  quizId: string;
  quizTitle: string;
  lessonTitle: string;
  courseTitle: string;
  passingScore: number;
  attemptsInPeriod: number;
  passedInPeriod: number;
  passRate: number;
  averageScore: number;
}

export interface LearningQualityData {
  summary: {
    quizAttemptsInPeriod: number;
    quizPassRate: number;
    averageQuizScore: number;
    lessonProgressByType: Array<{
      lessonType: 'video' | 'quiz' | 'text';
      totalRecords: number;
      completedRecords: number;
      completionRate: number;
    }>;
  };
  quizzes: QuizQualityItem[];
}

export type AdminOverviewResponse = ApiResponse<AdminOverviewData>;
export type CourseStatsResponse = ApiResponse<CourseStatsItem[]> & {
  pagination: PaginationMeta;
};
export type LecturerStatsResponse = ApiResponse<LecturerStatsItem[]> & {
  pagination: PaginationMeta;
};
export type LearningQualityResponse = ApiResponse<LearningQualityData> & {
  pagination: PaginationMeta;
};
