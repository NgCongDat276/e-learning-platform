import type { ApiResponse } from './api';

export type QuestionType = 'single_choice' | 'multiple_choice';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuizAttemptStatus = 'in_progress' | 'submitted';

/**
 * 1. Question Bank & Options Types
 */
export interface BankQuestionOption {
  id?: string;
  question_id?: string;
  content: string;
  is_correct: boolean;
  order_index?: number;
  created_at?: string;
}

export interface BankQuestion {
  id: string;
  bank_id: string;
  content: string;
  question_type: QuestionType;
  points: number;
  difficulty: QuestionDifficulty;
  topic: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  bank_question_options: BankQuestionOption[];
}

export interface QuestionBank {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  is_active: boolean;
  questions_count?: number;
  created_at?: string;
  updated_at?: string;
  bank_questions?: BankQuestion[];
}

export interface CreateQuestionBankRequest {
  title: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateQuestionBankRequest {
  title?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface CreateBankQuestionRequest {
  content: string;
  question_type: QuestionType;
  points?: number;
  difficulty?: QuestionDifficulty;
  topic?: string;
  order_index?: number;
  options: Array<{
    content: string;
    is_correct: boolean;
    order_index?: number;
  }>;
}

export interface UpdateBankQuestionRequest {
  content?: string;
  question_type?: QuestionType;
  points?: number;
  difficulty?: QuestionDifficulty;
  topic?: string;
  order_index?: number;
  options?: Array<{
    id?: string;
    content: string;
    is_correct: boolean;
    order_index?: number;
  }>;
}

/**
 * 2. Quiz Configuration & Rules Types
 */
export interface QuizQuestionRule {
  id?: string;
  quiz_id?: string;
  bank_id: string;
  bank_title?: string;
  question_count: number;
  difficulty?: QuestionDifficulty | null;
  topic?: string | null;
  points_per_question?: number;
}

export interface QuizConfig {
  id: string | null;
  title?: string | null;
  description?: string | null;
  passing_score: number;
  time_limit_minutes?: number | null;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
  rules: QuizQuestionRule[];
}

export interface StudentQuizSummary {
  attempts_count: number;
  max_attempts: number;
  best_score: number;
  is_passed: boolean;
  can_attempt: boolean;
  active_attempt_id: string | null;
}

export interface LessonQuizResponseData {
  is_configured: boolean;
  lesson_id: string;
  lesson_title: string;
  is_author?: boolean;
  quiz: QuizConfig | null;
  student_summary?: StudentQuizSummary;
}

export interface UpsertQuizConfigRequest {
  title?: string | null;
  description?: string | null;
  passing_score?: number;
  time_limit_minutes?: number | null;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
  rules?: QuizQuestionRule[];
}

/**
 * 3. Student Attempt & Taking Quiz Types
 */
export interface AttemptQuestionOption {
  id: string;
  content: string;
  order_index: number;
  is_selected?: boolean;
  is_correct?: boolean; // only in review if revealed
}

export interface AttemptQuestion {
  id: string; // attempt_question_id
  order_index: number;
  content: string;
  question_type: QuestionType;
  points: number;
  points_earned?: number;
  is_correct?: boolean;
  options: AttemptQuestionOption[];
}

export interface ActiveAttemptData {
  attempt_id: string;
  quiz_id: string;
  quiz_title?: string;
  attempt_number: number;
  started_at: string;
  time_limit_minutes?: number | null;
  passing_score: number;
  max_attempts: number;
  total_questions: number;
  questions: AttemptQuestion[];
}

export interface SubmitAnswerItem {
  attempt_question_id: string;
  selected_option_ids: string[];
}

export interface SubmitQuizAttemptRequest {
  answers: SubmitAnswerItem[];
}

export interface SubmitQuizResultData {
  attempt_id: string;
  score: number;
  is_passed: boolean;
  passing_score: number;
  total_earned_points: number;
  total_possible_points: number;
  total_questions: number;
  correct_count: number;
  submitted_at: string;
}

export interface QuizAttemptReviewData {
  attempt_id: string;
  quiz_id: string;
  quiz_title?: string;
  attempt_number: number;
  status: QuizAttemptStatus;
  score: number;
  is_passed: boolean;
  passing_score: number;
  started_at: string;
  submitted_at?: string;
  show_correct_answers: boolean;
  questions: AttemptQuestion[];
}

export interface MyAttemptItem {
  id: string;
  attempt_number: number;
  status: QuizAttemptStatus;
  score: number;
  is_passed: boolean;
  started_at: string;
  submitted_at?: string;
}

export interface TeacherAttemptItem {
  id: string;
  attempt_number: number;
  status: QuizAttemptStatus;
  score: number;
  is_passed: boolean;
  started_at: string;
  submitted_at?: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

/**
 * 4. API Response Wrappers
 */
export type QuestionBanksResponse = ApiResponse<QuestionBank[]>;
export type QuestionBankDetailResponse = ApiResponse<QuestionBank>;
export type BankQuestionDetailResponse = ApiResponse<BankQuestion>;
export type LessonQuizDetailResponse = ApiResponse<LessonQuizResponseData>;
export type UpsertQuizConfigResponse = ApiResponse<QuizConfig>;
export type ActiveAttemptResponse = ApiResponse<ActiveAttemptData>;
export type SubmitQuizResponse = ApiResponse<SubmitQuizResultData>;
export type QuizReviewResponse = ApiResponse<QuizAttemptReviewData>;
export type MyAttemptsResponse = ApiResponse<MyAttemptItem[]>;
export type TeacherAttemptsResponse = ApiResponse<TeacherAttemptItem[]>;
