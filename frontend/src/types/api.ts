export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: ApiErrorDetail[];
  pagination?: PaginationMeta;
}
