import { z } from "zod";
import { user_role } from "@prisma/client";

/**
 * Schema validate dữ liệu Đăng Ký tài khoản
 */
export const registerSchema = z.object({
  email: z
    .string({ error: "Email không được để trống" })
    .email("Định dạng email không hợp lệ")
    .max(255, "Email không được vượt quá 255 ký tự")
    .trim()
    .toLowerCase(),
  password: z
    .string({ error: "Mật khẩu không được để trống" })
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(100, "Mật khẩu không được vượt quá 100 ký tự"),
  full_name: z
    .string({ error: "Họ và tên không được để trống" })
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự")
    .trim(),
  role: z
    .enum([user_role.student, user_role.lecturer], {
      error: "Vai trò chỉ có thể là student hoặc lecturer",
    })
    .default(user_role.student),
});

/**
 * Schema validate dữ liệu Đăng Nhập
 */
export const loginSchema = z.object({
  email: z
    .string({ error: "Email không được để trống" })
    .email("Định dạng email không hợp lệ")
    .trim()
    .toLowerCase(),
  password: z.string({ error: "Mật khẩu không được để trống" }),
});

/**
 * Schema validate khi gọi API Refresh Token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string({
    error: "Refresh Token không được để trống",
  }),
});

// Trích xuất Type từ Zod Schema để dùng trong Service & Controller
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
