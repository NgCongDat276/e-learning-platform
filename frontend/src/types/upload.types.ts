import type { ApiResponse } from './api';

export type UploadFolder =
  | 'courses/thumbnails'
  | 'lessons/videos'
  | 'lessons/documents'
  | 'users/avatars';

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  folder?: UploadFolder;
  fileSize?: number;
}

export interface PresignedUrlResponseData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresInSeconds: number;
}

export type PresignedUrlResponse = ApiResponse<PresignedUrlResponseData>;
