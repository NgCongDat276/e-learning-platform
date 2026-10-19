import { z } from "zod";

/**
 * 1. Schema kiểm tra param courseId (hỗ trợ cả UUID lẫn Slug)
 */
export const courseIdentifierParamSchema = z.object({
  courseId: z
    .string({
      error: "Course identifier is required",
    })
    .trim()
    .min(1, "Course identifier cannot be empty"),
});

export type CourseIdentifierParam = z.infer<
  typeof courseIdentifierParamSchema
>;

/**
 * 2. Schema kiểm tra param lessonId (UUID)
 */
export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID format"),
});

export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;

/**
 * 3. Schema cập nhật vị trí xem video (last_watched_position)
 */
export const updateLessonProgressSchema = z.object({
  last_watched_position: z.coerce
    .number()
    .int("Last watched position must be an integer (seconds)")
    .min(0, "Position cannot be negative"),
});

export type UpdateLessonProgressInput = z.infer<
  typeof updateLessonProgressSchema
>;
