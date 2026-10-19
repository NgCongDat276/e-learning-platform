import { Request, Response } from "express";
import { uploadService } from "./upload.service";
import { sendSuccess } from "../../common/utils/api-response";

export class UploadController {
  /**
   * [POST] /upload/presigned-url - Sinh presigned URL để tải file lên Cloudflare R2
   */
  async getPresignedUrl(req: Request, res: Response): Promise<Response> {
    console.log("[UploadController] Requesting presigned URL:", {
      userId: req.user?.id,
      body: req.body,
    });
    const result = await uploadService.getPresignedUploadUrl(
      req.user!.id,
      req.body,
    );
    console.log("[UploadController] Generated presigned URL:", {
      fileUrl: result.fileUrl,
      key: result.key,
      uploadUrlHost: new URL(result.uploadUrl).host,
    });
    return sendSuccess(res, result, "Presigned URL generated successfully");
  }
}

export const uploadController = new UploadController();
