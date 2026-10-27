import { z } from "zod";
import { question_type, difficulty } from "@prisma/client";

/**
 * 1. Param Schemas
 */
export const courseIdParamSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
});
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;

export const bankIdParamSchema = z.object({
  bankId: z.string().uuid("Invalid question bank ID format"),
});
export type BankIdParam = z.infer<typeof bankIdParamSchema>;

export const questionIdParamSchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
});
export type QuestionIdParam = z.infer<typeof questionIdParamSchema>;

export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID format"),
});
export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;

export const attemptIdParamSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID format"),
});
export type AttemptIdParam = z.infer<typeof attemptIdParamSchema>;

/**
 * 2. Question Bank Schemas
 */
export const createQuestionBankSchema = z.object({
  title: z
    .string({ error: "Question bank title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title cannot exceed 255 characters"),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().default(true).optional(),
});
export type CreateQuestionBankInput = z.infer<typeof createQuestionBankSchema>;

export const updateQuestionBankSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title cannot exceed 255 characters")
    .optional(),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional(),
});
export type UpdateQuestionBankInput = z.infer<typeof updateQuestionBankSchema>;

/**
 * 3. Bank Questions & Options Schemas
 */
export const questionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  content: z
    .string({ error: "Option content is required" })
    .trim()
    .min(1, "Option content cannot be empty"),
  is_correct: z.boolean().default(false),
  order_index: z.coerce.number().int().min(0).optional(),
});
export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

export const createBankQuestionSchema = z
  .object({
    content: z
      .string({ error: "Question content is required" })
      .trim()
      .min(3, "Question content must be at least 3 characters"),
    question_type: z
      .nativeEnum(question_type, {
        error: "Question type must be 'single_choice' or 'multiple_choice'",
      })
      .default(question_type.single_choice),
    points: z.coerce
      .number()
      .int("Points must be an integer")
      .min(1, "Points must be at least 1")
      .default(1)
      .optional(),
    difficulty: z
      .nativeEnum(difficulty, {
        error: "Difficulty must be 'easy', 'medium', or 'hard'",
      })
      .default(difficulty.easy)
      .optional(),
    topic: z
      .string()
      .trim()
      .min(1, "Topic cannot be empty")
      .max(255, "Topic cannot exceed 255 characters")
      .default("General")
      .optional(),
    order_index: z.coerce.number().int().min(0).optional(),
    options: z
      .array(questionOptionSchema)
      .min(2, "Each question must have at least 2 options"),
  })
  .refine(
    (data) => {
      const correctCount = data.options.filter((opt) => opt.is_correct).length;
      if (data.question_type === question_type.single_choice) {
        return correctCount === 1;
      }
      return correctCount >= 1;
    },
    {
      message:
        "Single choice questions must have exactly 1 correct answer. Multiple choice questions must have at least 1 correct answer.",
      path: ["options"],
    },
  );
export type CreateBankQuestionInput = z.infer<typeof createBankQuestionSchema>;

export const updateBankQuestionSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(3, "Question content must be at least 3 characters")
      .optional(),
    question_type: z.nativeEnum(question_type).optional(),
    points: z.coerce.number().int().min(1).optional(),
    difficulty: z.nativeEnum(difficulty).optional(),
    topic: z.string().trim().min(1).max(255).optional(),
    order_index: z.coerce.number().int().min(0).optional(),
    options: z.array(questionOptionSchema).min(2).optional(),
  })
  .refine(
    (data) => {
      if (!data.options) return true;
      const correctCount = data.options.filter((opt) => opt.is_correct).length;
      const type = data.question_type || question_type.single_choice;
      if (type === question_type.single_choice) {
        return correctCount === 1;
      }
      return correctCount >= 1;
    },
    {
      message:
        "Single choice questions must have exactly 1 correct answer. Multiple choice questions must have at least 1 correct answer.",
      path: ["options"],
    },
  );
export type UpdateBankQuestionInput = z.infer<typeof updateBankQuestionSchema>;

/**
 * 4. Quiz Lesson Configuration & Rules
 */
export const quizRuleItemSchema = z.object({
  id: z.string().uuid().optional(),
  bank_id: z.string().uuid("Invalid question bank ID"),
  question_count: z.coerce
    .number()
    .int("Question count must be an integer")
    .min(1, "Question count must be at least 1"),
  difficulty: z.nativeEnum(difficulty).optional().nullable(),
  topic: z.string().trim().max(255).optional().nullable(),
  points_per_question: z.coerce.number().int().min(1).default(1).optional(),
});
export type QuizRuleItemInput = z.infer<typeof quizRuleItemSchema>;

export const upsertQuizConfigSchema = z.object({
  title: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  passing_score: z.coerce
    .number()
    .int("Passing score must be an integer percentage (0-100)")
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score cannot exceed 100")
    .default(60),
  time_limit_minutes: z.coerce
    .number()
    .int("Time limit must be in minutes")
    .min(0, "Time limit cannot be negative")
    .max(300, "Time limit cannot exceed 300 minutes")
    .optional()
    .nullable(),
  max_attempts: z.coerce
    .number()
    .int("Max attempts must be an integer")
    .min(1, "Max attempts must be at least 1")
    .max(50, "Max attempts cannot exceed 50")
    .default(1),
  shuffle_questions: z.boolean().default(true).optional(),
  shuffle_options: z.boolean().default(true).optional(),
  show_correct_answers: z.boolean().default(false).optional(),
  rules: z.array(quizRuleItemSchema).optional(),
});
export type UpsertQuizConfigInput = z.infer<typeof upsertQuizConfigSchema>;

/**
 * 5. Student Submit Attempt Schema
 */
export const submitQuizAttemptSchema = z.object({
  answers: z.array(
    z.object({
      attempt_question_id: z
        .string()
        .uuid("Invalid attempt question ID format"),
      selected_option_ids: z.array(
        z.string().uuid("Invalid option ID format"),
      ),
    }),
  ),
});
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
