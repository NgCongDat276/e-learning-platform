import { Request, Response } from "express";
import { quizzesService } from "./quizzes.service";
import { sendSuccess, sendCreated } from "../../common/utils/api-response";
import { user_role } from "@prisma/client";

export class QuizzesController {
  // ==========================================
  // 1. QUESTION BANKS
  // ==========================================

  /**
   * [GET] /quizzes/courses/:courseId/question-banks
   */
  async getCourseQuestionBanks(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const banks = await quizzesService.getCourseQuestionBanks(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, banks, "Question banks retrieved successfully");
  }

  /**
   * [GET] /quizzes/question-banks/:bankId
   */
  async getQuestionBankById(req: Request, res: Response): Promise<Response> {
    const bankId = req.params.bankId as string;
    const bank = await quizzesService.getQuestionBankById(
      bankId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, bank, "Question bank retrieved successfully");
  }

  /**
   * [POST] /quizzes/courses/:courseId/question-banks
   */
  async createQuestionBank(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const bank = await quizzesService.createQuestionBank(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendCreated(res, bank, "Question bank created successfully");
  }

  /**
   * [PUT] /quizzes/question-banks/:bankId
   */
  async updateQuestionBank(req: Request, res: Response): Promise<Response> {
    const bankId = req.params.bankId as string;
    const updated = await quizzesService.updateQuestionBank(
      bankId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Question bank updated successfully");
  }

  /**
   * [DELETE] /quizzes/question-banks/:bankId
   */
  async deleteQuestionBank(req: Request, res: Response): Promise<Response> {
    const bankId = req.params.bankId as string;
    const result = await quizzesService.deleteQuestionBank(
      bankId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, result, "Question bank deleted successfully");
  }

  // ==========================================
  // 2. BANK QUESTIONS
  // ==========================================

  /**
   * [POST] /quizzes/question-banks/:bankId/questions
   */
  async createBankQuestion(req: Request, res: Response): Promise<Response> {
    const bankId = req.params.bankId as string;
    const question = await quizzesService.createBankQuestion(
      bankId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendCreated(res, question, "Question created successfully");
  }

  /**
   * [GET] /quizzes/questions/:questionId
   */
  async getBankQuestionById(req: Request, res: Response): Promise<Response> {
    const questionId = req.params.questionId as string;
    const question = await quizzesService.getBankQuestionById(
      questionId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, question, "Question retrieved successfully");
  }

  /**
   * [PUT] /quizzes/questions/:questionId
   */
  async updateBankQuestion(req: Request, res: Response): Promise<Response> {
    const questionId = req.params.questionId as string;
    const updated = await quizzesService.updateBankQuestion(
      questionId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Question updated successfully");
  }

  /**
   * [DELETE] /quizzes/questions/:questionId
   */
  async deleteBankQuestion(req: Request, res: Response): Promise<Response> {
    const questionId = req.params.questionId as string;
    const result = await quizzesService.deleteBankQuestion(
      questionId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, result, "Question deleted successfully");
  }

  // ==========================================
  // 3. QUIZ LESSON CONFIGURATION
  // ==========================================

  /**
   * [GET] /quizzes/lessons/:lessonId
   */
  async getLessonQuiz(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const result = await quizzesService.getLessonQuiz(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, result, "Lesson quiz details retrieved successfully");
  }

  /**
   * [PUT] /quizzes/lessons/:lessonId
   */
  async upsertLessonQuiz(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const quiz = await quizzesService.upsertLessonQuiz(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, quiz, "Lesson quiz configuration saved successfully");
  }

  // ==========================================
  // 4. STUDENT QUIZ TAKING & SUBMISSIONS
  // ==========================================

  /**
   * [POST] /quizzes/lessons/:lessonId/start
   */
  async startQuizAttempt(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const attempt = await quizzesService.startQuizAttempt(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendCreated(res, attempt, "Quiz attempt started successfully");
  }

  /**
   * [GET] /quizzes/attempts/:attemptId
   */
  async getActiveAttempt(req: Request, res: Response): Promise<Response> {
    const attemptId = req.params.attemptId as string;
    const attempt = await quizzesService.getActiveAttempt(
      attemptId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, attempt, "Active attempt retrieved successfully");
  }

  /**
   * [POST] /quizzes/attempts/:attemptId/submit
   */
  async submitQuizAttempt(req: Request, res: Response): Promise<Response> {
    const attemptId = req.params.attemptId as string;
    const result = await quizzesService.submitQuizAttempt(
      attemptId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, result, "Quiz submitted and graded successfully");
  }

  /**
   * [GET] /quizzes/attempts/:attemptId/result
   */
  async getQuizAttemptResult(req: Request, res: Response): Promise<Response> {
    const attemptId = req.params.attemptId as string;
    const result = await quizzesService.getQuizAttemptResult(
      attemptId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, result, "Quiz attempt result retrieved successfully");
  }

  /**
   * [GET] /quizzes/lessons/:lessonId/my-attempts
   */
  async getMyLessonAttempts(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const attempts = await quizzesService.getMyLessonAttempts(
      lessonId,
      req.user!.id,
    );
    return sendSuccess(res, attempts, "My quiz attempts retrieved successfully");
  }

  /**
   * [GET] /quizzes/lessons/:lessonId/attempts (Lecturer / Admin)
   */
  async getLessonAttemptsForTeacher(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const data = await quizzesService.getLessonAttemptsForTeacher(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
      page,
      limit,
    );

    return sendSuccess(
      res,
      data.attempts,
      "Students quiz attempts retrieved successfully",
      200,
      data.pagination,
    );
  }
}

export const quizzesController = new QuizzesController();
