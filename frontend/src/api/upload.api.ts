import axios from 'axios';
import axiosClient from './axios-client';
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '../types/upload.types';

/**
 * 1. Gọi backend sinh Presigned URL từ Cloudflare R2
 */
export const getPresignedUrlApi = async (
  data: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  const response = (await axiosClient.post(
    '/upload/presigned-url',
    data
  )) as unknown as PresignedUrlResponse;
  return response;
};

/**
 * 2. Tải trực tiếp file lên Cloudflare R2 qua Presigned URL (kèm progress callback)
 * Lưu ý: Dùng axios riêng để KHÔNG gửi Bearer Token (tránh bị R2 từ chối vì thừa Header)
 */
export const uploadFileToR2Api = async (
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });
};
