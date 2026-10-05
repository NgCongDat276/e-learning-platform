import { z } from "zod";
import { course_level, course_status } from "@prisma/client";

/**
 * 1. Schema tạo khóa học mới (Lecturer / Admin)
 */
export const createCourseSchema = z.object({
  title: z
    .string({
      error: "Course title is required",
    })
    .trim()
    .min(5, "Course title must be at least 5 characters")
    .max(255, "Course title cannot exceed 255 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  thumbnail_url: z
    .string()
    .trim()
    .url("Invalid thumbnail URL format")
    .optional()
    .nullable()
    .or(z.literal("")),
  price: z.coerce
    .number({
      error: "Price must be a valid number",
    })
    .min(0, "Price must be greater than or equal to 0")
    .default(0),
  level: z
    .nativeEnum(course_level, {
      error: "Course level must be 'beginner', 'intermediate', or 'advanced'",
    })
    .default(course_level.beginner),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

/**
 * 2. Schema cập nhật thông tin khóa học (Lecturer / Admin)
 */
export const updateCourseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Course title must be at least 5 characters")
      .max(255, "Course title cannot exceed 255 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description cannot exceed 5000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),
    thumbnail_url: z
      .string()
      .trim()
      .url("Invalid thumbnail URL format")
      .optional()
      .nullable()
      .or(z.literal("")),
    price: z.coerce
      .number({
        error: "Price must be a valid number",
      })
      .min(0, "Price must be greater than or equal to 0")
      .optional(),
    level: z
      .nativeEnum(course_level, {
        error: "Course level must be 'beginner', 'intermediate', or 'advanced'",
      })
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update",
  );

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

/**
 * 3. Schema thay đổi trạng thái khóa học (DRAFT, PUBLISHED, HIDDEN)
 */
export const updateCourseStatusSchema = z.object({
  status: z.nativeEnum(course_status, {
    error: "Status must be 'draft', 'published', or 'hidden'",
  }),
});

export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusSchema>;

/**
 * 4. Schema truy vấn danh sách khóa học (Phân trang, tìm kiếm, lọc)
 */
export const queryCoursesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  level: z.nativeEnum(course_level).optional(),
  status: z.nativeEnum(course_status).optional(),
  lecturer_id: z.string().uuid("Invalid lecturer ID format").optional(),
  sort: z
    .enum(["latest", "oldest", "price_asc", "price_desc"])
    .default("latest")
    .optional(),
});

export type QueryCoursesInput = z.infer<typeof queryCoursesSchema>;

/**
 * 5. Schema params kiểm tra courseId (UUID) hoặc slug
 */
export const courseIdParamSchema = z.object({
  id: z.string().uuid("Invalid course ID format"),
});

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;

export const courseSlugParamSchema = z.object({
  slug: z.string().trim().min(1, "Course slug is required"),
});

export type CourseSlugParam = z.infer<typeof courseSlugParamSchema>;
