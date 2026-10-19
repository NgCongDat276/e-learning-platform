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
  console.log('[upload.api] Calling getPresignedUrlApi with payload:', data);
  try {
    const response = (await axiosClient.post(
      '/upload/presigned-url',
      data
    )) as unknown as PresignedUrlResponse;
    console.log('[upload.api] getPresignedUrlApi response:', response);
    return response;
  } catch (err) {
    console.error('[upload.api] getPresignedUrlApi failed:', err);
    throw err;
  }
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
  const mimeType = file.type || 'application/octet-stream';
  console.log('[upload.api] Starting uploadFileToR2Api:', {
    targetUrl: uploadUrl,
    fileName: file.name,
    fileSize: file.size,
    contentType: mimeType,
  });

  try {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': mimeType,
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
    console.log('[upload.api] uploadFileToR2Api finished successfully!');
  } catch (err) {
    console.error('[upload.api] uploadFileToR2Api failed directly during PUT request to R2:', err);
    throw err;
  }
};

