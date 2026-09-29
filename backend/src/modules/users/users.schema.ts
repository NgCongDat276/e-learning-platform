import { z } from "zod";
import { user_role } from "@prisma/client";

/**
 * 1. Schema cập nhật hồ sơ cá nhân
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  avatar_url: z
    .string()
    .trim()
    .url("Invalid avatar URL format")
    .optional()
    .nullable()
    .or(z.literal("")),
  // Các trường hồ sơ giảng viên (nếu có)
  degree: z
    .string()
    .trim()
    .max(100, "Degree cannot exceed 100 characters")
    .optional()
    .nullable(),
  expertise: z
    .string()
    .trim()
    .max(255, "Expertise cannot exceed 255 characters")
    .optional()
    .nullable(),
  bio: z
    .string()
    .trim()
    .max(1000, "Bio cannot exceed 1000 characters")
    .optional()
    .nullable(),
  certificates: z
    .string()
    .trim()
    .max(500, "Certificates cannot exceed 500 characters")
    .optional()
    .nullable(),
  cv_url: z
    .string()
    .trim()
    .url("Invalid CV URL format")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * 2. Schema đổi mật khẩu
 */
export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(8, "Current password must be at least 8 characters"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters"),
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * 3. Schema truy vấn danh sách người dùng (Admin)
 */
export const queryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.nativeEnum(user_role).optional(),
});

export type QueryUsersInput = z.infer<typeof queryUsersSchema>;

/**
 * 4. Schema cập nhật trạng thái kích hoạt tài khoản (Admin)
 */
export const updateUserStatusSchema = z.object({
  is_active: z.boolean({
    error: "is_active is required and must be a boolean",
  }),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
