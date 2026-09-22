/**
 * Hằng số phân trang mặc định
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Hằng số cấu hình xác thực
 */
export const AUTH_CONSTANTS = {
  BEARER_PREFIX: "Bearer ",
  REFRESH_TOKEN_COOKIE: "refreshToken",
} as const;

/**
 * Giới hạn tải lên tệp tin (File Upload Limits)
 */
export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5 MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024, // 20 MB (PDF, docs)
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500 MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf"],
} as const;

/**
 * Thông điệp phản hồi mặc định
 */
export const MESSAGES = {
  SERVER_ERROR: "Đã có lỗi xảy ra từ máy chủ, vui lòng thử lại sau",
  UNAUTHORIZED: "Vui lòng đăng nhập để thực hiện thao tác này",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  NOT_FOUND: "Không tìm thấy tài nguyên yêu cầu",
} as const;
