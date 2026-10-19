import { z } from "zod";

/**
 * 1. Schema tạo chương học mới (Lecturer / Admin)
 */
export const createChapterSchema = z.object({
  course_id: z.string().trim().min(1, "Course ID or slug is required"),
  title: z
    .string({
      error: "Chapter title is required",
    })
    .trim()
    .min(3, "Chapter title must be at least 3 characters")
    .max(255, "Chapter title cannot exceed 255 characters"),
  order_index: z.number().int().positive().optional(),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

/**
 * 2. Schema cập nhật tiêu đề chương học (Lecturer / Admin)
 */
export const updateChapterSchema = z.object({
  title: z
    .string({
      error: "Chapter title is required",
    })
    .trim()
    .min(3, "Chapter title must be at least 3 characters")
    .max(255, "Chapter title cannot exceed 255 characters"),
});

export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

/**
 * 3. Schema sắp xếp lại thứ tự các chương học trong khóa học
 */
export const reorderChaptersSchema = z.object({
  course_id: z.string().trim().min(1, "Course ID or slug is required"),
  items: z
    .array(
      z.object({
        id: z.string().uuid("Invalid chapter ID format"),
        order_index: z
          .number()
          .int()
          .min(1, "Order index must be a positive integer"),
      }),
    )
    .min(1, "At least one chapter must be provided for reordering"),
});

export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;

/**
 * 4. Schema Params: chapterId (UUID)
 */
export const chapterIdParamSchema = z.object({
  id: z.string().uuid("Invalid chapter ID format"),
});

export type ChapterIdParam = z.infer<typeof chapterIdParamSchema>;

/**
 * 5. Schema Params: courseId (UUID hoặc Slug)
 */
export const courseIdParamSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID or slug is required"),
});

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
