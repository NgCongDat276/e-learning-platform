import { z } from "zod";
import { lecturer_request_status } from "@prisma/client";

/**
 * 1. Schema truy vấn danh sách đơn xin làm giảng viên (Admin)
 */
export const queryLecturerRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(["all", ...Object.values(lecturer_request_status)])
    .default("all"),
  search: z.string().trim().optional(),
});

export type QueryLecturerRequestsInput = z.infer<
  typeof queryLecturerRequestsSchema
>;

/**
 * 2. Schema phê duyệt hoặc từ chối đơn xin làm giảng viên (Admin)
 */
export const reviewLecturerRequestSchema = z.object({
  status: z.enum(
    [lecturer_request_status.approved, lecturer_request_status.rejected],
    {
      error: "Trạng thái chỉ có thể là approved hoặc rejected",
    },
  ),
  note: z
    .string()
    .trim()
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
    .optional(),
});

export type ReviewLecturerRequestInput = z.infer<
  typeof reviewLecturerRequestSchema
>;

/**
 * 3. Schema validate param requestId (UUID)
 */
export const requestIdParamSchema = z.object({
  id: z.string().uuid("ID đơn yêu cầu không đúng định dạng UUID"),
});
