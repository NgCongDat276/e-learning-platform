import axiosClient from './axios-client';
import type { ApiResponse } from '../types/api';
import type {
  QuestionBanksResponse,
  QuestionBankDetailResponse,
  BankQuestionDetailResponse,
  LessonQuizDetailResponse,
  UpsertQuizConfigResponse,
  ActiveAttemptResponse,
  SubmitQuizResponse,
  QuizReviewResponse,
  MyAttemptsResponse,
  TeacherAttemptsResponse,
  CreateQuestionBankRequest,
  UpdateQuestionBankRequest,
  CreateBankQuestionRequest,
  UpdateBankQuestionRequest,
  UpsertQuizConfigRequest,
  SubmitQuizAttemptRequest,
} from '../types/quiz.types';

// ==========================================
// 1. QUESTION BANKS API
// ==========================================

/**
 * Lấy danh sách ngân hàng câu hỏi của một khóa học
 */
export const getCourseQuestionBanksApi = async (
  courseId: string
): Promise<QuestionBanksResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/courses/${courseId}/question-banks`
  )) as unknown as QuestionBanksResponse;
  return response;
};

/**
 * Xem chi tiết ngân hàng câu hỏi (kèm danh sách câu hỏi)
 */
export const getQuestionBankByIdApi = async (
  bankId: string
): Promise<QuestionBankDetailResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/question-banks/${bankId}`
  )) as unknown as QuestionBankDetailResponse;
  return response;
};

/**
 * Tạo ngân hàng câu hỏi mới
 */
export const createQuestionBankApi = async (
  courseId: string,
  data: CreateQuestionBankRequest
): Promise<QuestionBankDetailResponse> => {
  const response = (await axiosClient.post(
    `/quizzes/courses/${courseId}/question-banks`,
    data
  )) as unknown as QuestionBankDetailResponse;
  return response;
};

/**
 * Cập nhật thông tin ngân hàng câu hỏi
 */
export const updateQuestionBankApi = async (
  bankId: string,
  data: UpdateQuestionBankRequest
): Promise<QuestionBankDetailResponse> => {
  const response = (await axiosClient.put(
    `/quizzes/question-banks/${bankId}`,
    data
  )) as unknown as QuestionBankDetailResponse;
  return response;
};

/**
 * Xóa ngân hàng câu hỏi
 */
export const deleteQuestionBankApi = async (
  bankId: string
): Promise<ApiResponse<void>> => {
  const response = (await axiosClient.delete(
    `/quizzes/question-banks/${bankId}`
  )) as unknown as ApiResponse<void>;
  return response;
};

// ==========================================
// 2. BANK QUESTIONS API
// ==========================================

/**
 * Thêm câu hỏi mới vào ngân hàng câu hỏi
 */
export const createBankQuestionApi = async (
  bankId: string,
  data: CreateBankQuestionRequest
): Promise<BankQuestionDetailResponse> => {
  const response = (await axiosClient.post(
    `/quizzes/question-banks/${bankId}/questions`,
    data
  )) as unknown as BankQuestionDetailResponse;
  return response;
};

/**
 * Xem chi tiết câu hỏi
 */
export const getBankQuestionByIdApi = async (
  questionId: string
): Promise<BankQuestionDetailResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/questions/${questionId}`
  )) as unknown as BankQuestionDetailResponse;
  return response;
};

/**
 * Cập nhật câu hỏi và options
 */
export const updateBankQuestionApi = async (
  questionId: string,
  data: UpdateBankQuestionRequest
): Promise<BankQuestionDetailResponse> => {
  const response = (await axiosClient.put(
    `/quizzes/questions/${questionId}`,
    data
  )) as unknown as BankQuestionDetailResponse;
  return response;
};

/**
 * Xóa câu hỏi khỏi ngân hàng
 */
export const deleteBankQuestionApi = async (
  questionId: string
): Promise<ApiResponse<void>> => {
  const response = (await axiosClient.delete(
    `/quizzes/questions/${questionId}`
  )) as unknown as ApiResponse<void>;
  return response;
};

// ==========================================
// 3. QUIZ LESSON CONFIGURATION API
// ==========================================

/**
 * Lấy cấu hình Quiz của bài học (kèm rules và lịch sử người dùng)
 */
export const getLessonQuizApi = async (
  lessonId: string
): Promise<LessonQuizDetailResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/lessons/${lessonId}`
  )) as unknown as LessonQuizDetailResponse;
  return response;
};

/**
 * Thiết lập / Cập nhật cấu hình Quiz cho bài học
 */
export const upsertLessonQuizApi = async (
  lessonId: string,
  data: UpsertQuizConfigRequest
): Promise<UpsertQuizConfigResponse> => {
  const response = (await axiosClient.put(
    `/quizzes/lessons/${lessonId}`,
    data
  )) as unknown as UpsertQuizConfigResponse;
  return response;
};

// ==========================================
// 4. STUDENT QUIZ TAKING & GRADING API
// ==========================================

/**
 * Bắt đầu làm bài thi (hoặc tiếp tục attempt đang dở)
 */
export const startQuizAttemptApi = async (
  lessonId: string
): Promise<ActiveAttemptResponse> => {
  const response = (await axiosClient.post(
    `/quizzes/lessons/${lessonId}/start`
  )) as unknown as ActiveAttemptResponse;
  return response;
};

/**
 * Lấy dữ liệu bài thi đang làm dở (khi refresh)
 */
export const getActiveAttemptApi = async (
  attemptId: string
): Promise<ActiveAttemptResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/attempts/${attemptId}`
  )) as unknown as ActiveAttemptResponse;
  return response;
};

/**
 * Nộp bài thi và chấm điểm tự động
 */
export const submitQuizAttemptApi = async (
  attemptId: string,
  data: SubmitQuizAttemptRequest
): Promise<SubmitQuizResponse> => {
  const response = (await axiosClient.post(
    `/quizzes/attempts/${attemptId}/submit`,
    data
  )) as unknown as SubmitQuizResponse;
  return response;
};

/**
 * Xem kết quả bài thi chi tiết (Review)
 */
export const getQuizAttemptResultApi = async (
  attemptId: string
): Promise<QuizReviewResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/attempts/${attemptId}/result`
  )) as unknown as QuizReviewResponse;
  return response;
};

/**
 * Xem lịch sử các lần thi của học viên trong bài học
 */
export const getMyLessonAttemptsApi = async (
  lessonId: string
): Promise<MyAttemptsResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/lessons/${lessonId}/my-attempts`
  )) as unknown as MyAttemptsResponse;
  return response;
};

/**
 * Giảng viên / Admin xem thống kê kết quả làm bài của học viên
 */
export const getTeacherQuizAttemptsApi = async (
  lessonId: string,
  page: number = 1,
  limit: number = 20
): Promise<TeacherAttemptsResponse> => {
  const response = (await axiosClient.get(
    `/quizzes/lessons/${lessonId}/attempts`,
    { params: { page, limit } }
  )) as unknown as TeacherAttemptsResponse;
  return response;
};
