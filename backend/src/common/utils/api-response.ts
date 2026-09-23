import { Response } from "express";
import { HttpStatus, HttpStatusCode } from "../errors/http-status";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Khuôn mẫu chuẩn cho toàn bộ API Response trả về Client
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: HttpStatusCode;
  message: string;
  data?: T;
  errors?: any;
  pagination?: PaginationMeta;
}

/**
 * Helper: Trả về phản hồi thành công (Mặc định HTTP 200 OK)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Thao tác thành công",
  statusCode: HttpStatusCode = HttpStatus.OK,
  pagination?: PaginationMeta,
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    ...(pagination && { pagination }),
  };

  return res.status(statusCode).json(responsePayload);
};

/**
 * Helper: Trả về phản hồi khi tạo mới tài nguyên thành công (HTTP 201 Created)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = "Tạo mới thành công",
): Response => {
  return sendSuccess(res, data, message, HttpStatus.CREATED);
};

/**
 * Helper: Trả về phản hồi khi có lỗi (Dùng trong Error Handler Middleware)
 */
export const sendError = (
  res: Response,
  message: string = "Đã có lỗi xảy ra",
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: any,
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(responsePayload);
};
