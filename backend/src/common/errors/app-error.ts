import { HttpStatus, HttpStatusCode } from './http-status';

/**
 * Base AppError: Đại diện cho tất cả các lỗi nghiệp vụ dự liệu trước được (Operational Errors)
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errorsDetails?: any;

  constructor(message: string, statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR, errorsDetails?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Phân biệt lỗi nghiệp vụ có thể kiểm soát được với lỗi crash do bug code
    this.errorsDetails = errorsDetails;

    // Giữ nguyên stack trace chính xác tới nơi ném lỗi
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request: Dữ liệu gửi lên không đúng định dạng
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Dữ liệu yêu cầu không hợp lệ', errorsDetails?: any) {
    super(message, HttpStatus.BAD_REQUEST, errorsDetails);
  }
}

/**
 * 401 Unauthorized: Chưa đăng nhập hoặc token không hợp lệ / hết hạn
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Không có quyền truy cập / Chưa đăng nhập') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 403 Forbidden: Đã đăng nhập nhưng không đủ quyền (Role không khớp)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Bạn không có quyền thực hiện thao tác này') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

/**
 * 404 Not Found: Không tìm thấy tài nguyên (User, Course, Lesson,...)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Không tìm thấy tài nguyên yêu cầu') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 409 Conflict: Dữ liệu bị xung đột / trùng lặp (ví dụ: Email đã tồn tại)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Dữ liệu đã tồn tại hoặc xảy ra xung đột') {
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * 422 Unprocessable Entity: Dữ liệu đúng cú pháp nhưng sai về mặt logic/nghiệp vụ
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Dữ liệu không vượt qua kiểm tra hợp lệ', errorsDetails?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorsDetails);
  }
}

/**
 * 500 Internal Server Error: Lỗi hệ thống máy chủ
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Đã có lỗi xảy ra từ máy chủ, vui lòng thử lại sau') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
