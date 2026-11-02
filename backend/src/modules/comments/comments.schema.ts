import { z } from "zod";

/**
 * 1. Schema Params: lessonId (UUID)
 */
export const lessonCommentsParamSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID format"),
});

export type LessonCommentsParam = z.infer<typeof lessonCommentsParamSchema>;

/**
 * 2. Schema Params: commentId (UUID)
 */
export const commentIdParamSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID format"),
});

export type CommentIdParam = z.infer<typeof commentIdParamSchema>;

/**
 * 3. Schema Query: Phân trang danh sách bình luận gốc của bài học
 */
export const getLessonCommentsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(20),
});

export type GetLessonCommentsQuery = z.infer<
  typeof getLessonCommentsQuerySchema
>;

/**
 * 4. Schema Body: Tạo bình luận mới hoặc trả lời bình luận
 */
export const createCommentSchema = z.object({
  content: z
    .string({
      error: "Comment content is required",
    })
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment content cannot exceed 2000 characters"),
  parent_comment_id: z
    .string()
    .uuid("Invalid parent comment ID format")
    .optional()
    .nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * 5. Schema Body: Cập nhật nội dung bình luận
 */
export const updateCommentSchema = z.object({
  content: z
    .string({
      error: "Comment content is required",
    })
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment content cannot exceed 2000 characters"),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

