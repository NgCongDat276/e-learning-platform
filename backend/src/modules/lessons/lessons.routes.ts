import { Router } from "express";
import { lessonsController } from "./lessons.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import {
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
  lessonIdParamSchema,
} from "./lessons.schema";

const router = Router();

// Tất cả các route bài học đều yêu cầu đăng nhập
router.use(authenticate);

// [POST] /lessons - Tạo bài học mới trong chương (Giảng viên / Admin)
router.post(
  "/",
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: createLessonSchema }),
  lessonsController.createLesson,
);

// [PATCH] /lessons/reorder - Sắp xếp lại thứ tự bài học trong chương (đặt trước /:id)
router.patch(
  "/reorder",
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: reorderLessonsSchema }),
  lessonsController.reorderLessons,
);

// [GET] /lessons/:id - Xem chi tiết bài học
router.get(
  "/:id",
  validate({ params: lessonIdParamSchema }),
  lessonsController.getLessonById,
);

// [PUT] /lessons/:id - Cập nhật bài học (Giảng viên / Admin)
router.put(
  "/:id",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: lessonIdParamSchema, body: updateLessonSchema }),
  lessonsController.updateLesson,
);

// [DELETE] /lessons/:id - Xóa bài học (Giảng viên / Admin)
router.delete(
  "/:id",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: lessonIdParamSchema }),
  lessonsController.deleteLesson,
);

export default router;
