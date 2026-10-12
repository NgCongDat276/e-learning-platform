import { Request, Response } from "express";
import { uploadService } from "./upload.service";
import { sendSuccess } from "../../common/utils/api-response";

export class UploadController {
  /**
   * [POST] /upload/presigned-url - Sinh presigned URL để tải file lên Cloudflare R2
   */
  async getPresignedUrl(req: Request, res: Response): Promise<Response> {
    const result = await uploadService.getPresignedUploadUrl(
      req.user!.id,
      req.body,
    );
    return sendSuccess(res, result, "Presigned URL generated successfully");
  }
}

export const uploadController = new UploadController();
