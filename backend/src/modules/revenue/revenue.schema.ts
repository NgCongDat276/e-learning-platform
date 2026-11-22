import { z } from "zod";
import { order_status, payout_status, wallet_tx_type } from "@prisma/client";

const optionalDateSchema = z.preprocess(
  (val) => (val === undefined || val === "" ? undefined : val),
  z.coerce.date().optional(),
);

export const lecturerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  courseId: z.string().uuid().optional(),
  fromTime: optionalDateSchema,
  toTime: optionalDateSchema,
});

export const lecturerTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.nativeEnum(wallet_tx_type).optional(),
});

export const updateBankAccountSchema = z.object({
  bankBin: z.string().trim().min(4).max(20),
  bankName: z.string().trim().min(2).max(100),
  bankAccountNumber: z
    .string()
    .trim()
    .min(4, "Số tài khoản tối thiểu 4 ký tự")
    .max(50)
    .regex(/^[A-Za-z0-9]+$/, "Số tài khoản chỉ gồm chữ cái và số"),
  bankAccountName: z.string().trim().min(2).max(100),
});

export const createPayoutSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Số tiền rút phải lớn hơn 0")
    .max(1_000_000_000, "Số tiền vượt quá giới hạn cho phép"),
  lecturerNote: z.string().trim().max(500).optional(),
});

export const payoutIdParamSchema = z.object({
  id: z.string().uuid("Payout ID không hợp lệ"),
});

export const lecturerPayoutsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(payout_status).optional(),
});

export const adminFinanceSummaryQuerySchema = z.object({
  fromTime: optionalDateSchema,
  toTime: optionalDateSchema,
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(order_status).optional(),
  courseId: z.string().uuid().optional(),
  lecturerId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  fromTime: optionalDateSchema,
  toTime: optionalDateSchema,
});

export const updatePlatformSettingsSchema = z
  .object({
    defaultPlatformFeeRate: z.coerce.number().min(0).max(100).optional(),
    minPayoutAmount: z.coerce.number().min(0).max(100_000_000).optional(),
    orderExpiryMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  })
  .refine(
    (data) =>
      data.defaultPlatformFeeRate !== undefined ||
      data.minPayoutAmount !== undefined ||
      data.orderExpiryMinutes !== undefined,
    { message: "Cần cung cấp ít nhất một trường cấu hình để cập nhật" },
  );

export const lecturerIdParamSchema = z.object({
  lecturerId: z.string().uuid("lecturerId không hợp lệ"),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid("courseId không hợp lệ"),
});

export const updateCommissionRateSchema = z.object({
  platformFeeRate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.number().min(0).max(100).nullable(),
  ),
});

export const adminPayoutsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(payout_status).optional(),
  lecturerId: z.string().uuid().optional(),
});

export const completePayoutSchema = z.object({
  transactionReference: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập mã tham chiếu giao dịch ngân hàng")
    .max(100),
  proofImageUrl: z.string().trim().url().optional().or(z.literal("")),
  adminNote: z.string().trim().max(500).optional(),
});

export const rejectPayoutSchema = z.object({
  adminNote: z
    .string()
    .trim()
    .min(3, "Vui lòng nhập lý do từ chối yêu cầu rút tiền")
    .max(500),
});

export type LecturerOrdersQueryInput = z.infer<typeof lecturerOrdersQuerySchema>;
export type LecturerTransactionsQueryInput = z.infer<
  typeof lecturerTransactionsQuerySchema
>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type LecturerPayoutsQueryInput = z.infer<
  typeof lecturerPayoutsQuerySchema
>;
export type AdminFinanceSummaryQueryInput = z.infer<
  typeof adminFinanceSummaryQuerySchema
>;
export type AdminOrdersQueryInput = z.infer<typeof adminOrdersQuerySchema>;
export type UpdatePlatformSettingsInput = z.infer<
  typeof updatePlatformSettingsSchema
>;
export type AdminPayoutsQueryInput = z.infer<typeof adminPayoutsQuerySchema>;
export type CompletePayoutInput = z.infer<typeof completePayoutSchema>;
export type RejectPayoutInput = z.infer<typeof rejectPayoutSchema>;
