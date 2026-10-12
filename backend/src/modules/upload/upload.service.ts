import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "../../config/r2.config";
import { envConfig } from "../../config/env.config";
import type { GetPresignedUrlInput } from "./upload.schema";
import { BadRequestError } from "../../common/errors/app-error";
import crypto from "crypto";

export class UploadService {
  /**
   * Sinh Presigned URL tải file an toàn lên Cloudflare R2
   */
  async getPresignedUploadUrl(userId: string, input: GetPresignedUrlInput) {
    if (!envConfig.R2.ACCOUNT_ID || !envConfig.R2.ACCESS_KEY_ID) {
      throw new BadRequestError(
        "Cloudflare R2 credentials are not configured on the server",
      );
    }

    const { fileName, contentType, folder } = input;

    // 1. Chuẩn hóa tên file (bỏ ký tự đặc biệt, giữ lại extension)
    const sanitizedOriginalName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const timestamp = Date.now();
    const objectKey = `${folder}/${timestamp}-${uniqueId}-${sanitizedOriginalName}`;

    // 2. Tạo lệnh S3 PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: envConfig.R2.BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        "uploaded-by": userId,
        "original-filename": encodeURIComponent(fileName),
      },
    });

    // 3. Ký Presigned URL (hiệu lực trong 3600s = 1 tiếng cho video lớn)
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    // 4. Đường dẫn URL công khai để lưu vào database sau khi upload thành công
    const publicBase = envConfig.R2.PUBLIC_URL
      ? envConfig.R2.PUBLIC_URL.replace(/\/+$/, "")
      : `https://${envConfig.R2.ACCOUNT_ID}.r2.cloudflarestorage.com/${envConfig.R2.BUCKET_NAME}`;

    const fileUrl = `${publicBase}/${objectKey}`;

    return {
      uploadUrl,
      fileUrl,
      key: objectKey,
      expiresInSeconds: 3600,
    };
  }
}

export const uploadService = new UploadService();
