import { Router } from "express";
import { chaptersController } from "./chapters.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import {
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
  chapterIdParamSchema,
  courseIdParamSchema,
} from "./chapters.schema";

const router = Router();

// Tất cả các route quản lý chương học đều yêu cầu đăng nhập và có quyền Giảng viên hoặc Admin
router.use(authenticate, authorize(user_role.lecturer, user_role.admin));

// [GET] /chapters/course/:courseId - Lấy danh sách chương của khóa học
router.get(
  "/course/:courseId",
  validate({ params: courseIdParamSchema }),
  chaptersController.getChaptersByCourse,
);

// [POST] /chapters - Tạo chương học mới
router.post(
  "/",
  validate({ body: createChapterSchema }),
  chaptersController.createChapter,
);

// [PATCH] /chapters/reorder - Sắp xếp lại thứ tự các chương học (đặt trước /:id)
router.patch(
  "/reorder",
  validate({ body: reorderChaptersSchema }),
  chaptersController.reorderChapters,
);

// [PUT] /chapters/:id - Cập nhật tiêu đề chương học
router.put(
  "/:id",
  validate({ params: chapterIdParamSchema, body: updateChapterSchema }),
  chaptersController.updateChapter,
);

// [DELETE] /chapters/:id - Xóa chương học
router.delete(
  "/:id",
  validate({ params: chapterIdParamSchema }),
  chaptersController.deleteChapter,
);

export default router;
