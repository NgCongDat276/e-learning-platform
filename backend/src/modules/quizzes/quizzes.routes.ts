import { Router } from "express";
import { quizzesController } from "./quizzes.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import {
  courseIdParamSchema,
  bankIdParamSchema,
  questionIdParamSchema,
  lessonIdParamSchema,
  attemptIdParamSchema,
  createQuestionBankSchema,
  updateQuestionBankSchema,
  createBankQuestionSchema,
  updateBankQuestionSchema,
  upsertQuizConfigSchema,
  submitQuizAttemptSchema,
} from "./quizzes.schema";

const router = Router();

// Tất cả các route liên quan đến Quiz đều yêu cầu đăng nhập
router.use(authenticate);

// ==========================================
// 1. QUESTION BANKS (Lecturer / Admin)
// ==========================================

// [GET] /quizzes/courses/:courseId/question-banks - Lấy danh sách ngân hàng câu hỏi của khóa học
router.get(
  "/courses/:courseId/question-banks",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdParamSchema }),
  quizzesController.getCourseQuestionBanks,
);

// [POST] /quizzes/courses/:courseId/question-banks - Tạo ngân hàng câu hỏi mới
router.post(
  "/courses/:courseId/question-banks",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdParamSchema, body: createQuestionBankSchema }),
  quizzesController.createQuestionBank,
);

// [GET] /quizzes/question-banks/:bankId - Xem chi tiết ngân hàng câu hỏi
router.get(
  "/question-banks/:bankId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: bankIdParamSchema }),
  quizzesController.getQuestionBankById,
);

// [PUT] /quizzes/question-banks/:bankId - Cập nhật thông tin ngân hàng câu hỏi
router.put(
  "/question-banks/:bankId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: bankIdParamSchema, body: updateQuestionBankSchema }),
  quizzesController.updateQuestionBank,
);

// [DELETE] /quizzes/question-banks/:bankId - Xóa ngân hàng câu hỏi
router.delete(
  "/question-banks/:bankId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: bankIdParamSchema }),
  quizzesController.deleteQuestionBank,
);

// ==========================================
// 2. BANK QUESTIONS & OPTIONS (Lecturer / Admin)
// ==========================================

// [POST] /quizzes/question-banks/:bankId/questions - Thêm câu hỏi vào ngân hàng
router.post(
  "/question-banks/:bankId/questions",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: bankIdParamSchema, body: createBankQuestionSchema }),
  quizzesController.createBankQuestion,
);

// [GET] /quizzes/questions/:questionId - Xem chi tiết câu hỏi
router.get(
  "/questions/:questionId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: questionIdParamSchema }),
  quizzesController.getBankQuestionById,
);

// [PUT] /quizzes/questions/:questionId - Cập nhật câu hỏi và options
router.put(
  "/questions/:questionId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: questionIdParamSchema, body: updateBankQuestionSchema }),
  quizzesController.updateBankQuestion,
);

// [DELETE] /quizzes/questions/:questionId - Xóa câu hỏi khỏi ngân hàng
router.delete(
  "/questions/:questionId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: questionIdParamSchema }),
  quizzesController.deleteBankQuestion,
);

// ==========================================
// 3. QUIZ LESSON CONFIGURATION
// ==========================================

// [GET] /quizzes/lessons/:lessonId - Lấy cấu hình quiz của bài học
router.get(
  "/lessons/:lessonId",
  validate({ params: lessonIdParamSchema }),
  quizzesController.getLessonQuiz,
);

// [PUT] /quizzes/lessons/:lessonId - Cập nhật/Thiết lập cấu hình Quiz cho bài học (Lecturer / Admin)
router.put(
  "/lessons/:lessonId",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: lessonIdParamSchema, body: upsertQuizConfigSchema }),
  quizzesController.upsertLessonQuiz,
);

// ==========================================
// 4. STUDENT QUIZ TAKING & SUBMISSIONS
// ==========================================

// [POST] /quizzes/lessons/:lessonId/start (or /lessons/:lessonId/quizzes/start)
router.post(
  ["/lessons/:lessonId/start", "/lessons/:lessonId/quizzes/start"],
  validate({ params: lessonIdParamSchema }),
  quizzesController.startQuizAttempt,
);

// [GET] /quizzes/lessons/:lessonId/my-attempts - Lịch sử làm bài của học viên trong bài học này
router.get(
  "/lessons/:lessonId/my-attempts",
  validate({ params: lessonIdParamSchema }),
  quizzesController.getMyLessonAttempts,
);

// [GET] /quizzes/lessons/:lessonId/attempts - Thống kê bài làm của học sinh (Lecturer / Admin)
router.get(
  "/lessons/:lessonId/attempts",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: lessonIdParamSchema }),
  quizzesController.getLessonAttemptsForTeacher,
);

// [GET] /quizzes/attempts/:attemptId (or /quiz-attempts/:attemptId)
router.get(
  ["/attempts/:attemptId", "/quiz-attempts/:attemptId"],
  validate({ params: attemptIdParamSchema }),
  quizzesController.getActiveAttempt,
);

// [POST] /quizzes/attempts/:attemptId/submit (or /quiz-attempts/:attemptId/submit)
router.post(
  ["/attempts/:attemptId/submit", "/quiz-attempts/:attemptId/submit"],
  validate({ params: attemptIdParamSchema, body: submitQuizAttemptSchema }),
  quizzesController.submitQuizAttempt,
);

// [GET] /quizzes/attempts/:attemptId/result (or /quiz-attempts/:attemptId/result)
router.get(
  ["/attempts/:attemptId/result", "/quiz-attempts/:attemptId/result"],
  validate({ params: attemptIdParamSchema }),
  quizzesController.getQuizAttemptResult,
);

export default router;
