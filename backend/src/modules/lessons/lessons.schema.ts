import { z } from "zod";
import { lesson_type } from "@prisma/client";

/**
 * 1. Schema tạo bài học mới (Lecturer / Admin)
 */
export const createLessonSchema = z.object({
  chapter_id: z.string().uuid("Invalid chapter ID format"),
  title: z
    .string({
      error: "Lesson title is required",
    })
    .trim()
    .min(3, "Lesson title must be at least 3 characters")
    .max(255, "Lesson title cannot exceed 255 characters"),
  lesson_type: z
    .nativeEnum(lesson_type, {
      error: "Lesson type must be 'video', 'quiz', or 'text'",
    })
    .default(lesson_type.video),
  content_url: z
    .string()
    .trim()
    .url("Invalid content URL format")
    .optional()
    .nullable()
    .or(z.literal("")),
  lesson_content: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  duration_seconds: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(0, "Duration cannot be negative")
    .default(0)
    .optional(),
  order_index: z.number().int().positive().optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

/**
 * 2. Schema cập nhật bài học (Lecturer / Admin)
 */
export const updateLessonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Lesson title must be at least 3 characters")
      .max(255, "Lesson title cannot exceed 255 characters")
      .optional(),
    lesson_type: z
      .nativeEnum(lesson_type, {
        error: "Lesson type must be 'video', 'quiz', or 'text'",
      })
      .optional(),
    content_url: z
      .string()
      .trim()
      .url("Invalid content URL format")
      .optional()
      .nullable()
      .or(z.literal("")),
    lesson_content: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal("")),
    duration_seconds: z.coerce
      .number()
      .int("Duration must be an integer")
      .min(0, "Duration cannot be negative")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update",
  );

export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

/**
 * 3. Schema sắp xếp lại thứ tự các bài học trong một chương
 */
export const reorderLessonsSchema = z.object({
  chapter_id: z.string().uuid("Invalid chapter ID format"),
  items: z
    .array(
      z.object({
        id: z.string().uuid("Invalid lesson ID format"),
        order_index: z
          .number()
          .int()
          .min(1, "Order index must be a positive integer"),
      }),
    )
    .min(1, "At least one lesson must be provided for reordering"),
});

export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;

/**
 * 4. Schema Params: lessonId (UUID)
 */
export const lessonIdParamSchema = z.object({
  id: z.string().uuid("Invalid lesson ID format"),
});

export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;
