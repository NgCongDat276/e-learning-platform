import { z } from "zod";
import { order_status } from "@prisma/client";

export const createOrderSchema = z.object({
  courseId: z
    .string()
    .trim()
    .min(1, "courseId (UUID or slug) is required"),
});

export const orderCodeParamSchema = z.object({
  orderCode: z.coerce
    .number()
    .int("orderCode must be an integer")
    .positive("orderCode must be positive"),
});

export const myOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(order_status).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MyOrdersQueryInput = z.infer<typeof myOrdersQuerySchema>;
