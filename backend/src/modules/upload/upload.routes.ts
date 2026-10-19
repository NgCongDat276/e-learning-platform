import { Router } from "express";
import { uploadController } from "./upload.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import { getPresignedUrlSchema } from "./upload.schema";

const router = Router();

// [POST] /upload/presigned-url - Sinh URL ký sẵn để upload file thẳng lên Cloudflare R2
router.post(
  "/presigned-url",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: getPresignedUrlSchema }),
  uploadController.getPresignedUrl,
);

export default router;
