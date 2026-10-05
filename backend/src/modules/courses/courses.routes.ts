import { Router } from "express";
import { coursesController } from "./courses.controller";
import {
  authenticate,
  optionalAuthenticate,
} from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseStatusSchema,
  queryCoursesSchema,
  courseIdParamSchema,
  courseSlugParamSchema,
} from "./courses.schema";

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (Học viên & Khách)
// ==========================================

// [GET] /courses - Danh sách khóa học công khai (Phân trang, lọc, tìm kiếm)
router.get(
  "/",
  validate({ query: queryCoursesSchema }),
  coursesController.getCoursesList,
);

// ==========================================
// 2. TEACHING WORKSPACE ROUTES (Giảng viên / Admin)
// Lưu ý: Đặt TRƯỚC /:slug để tránh bị Express match nhầm 'teaching' là slug
// ==========================================

// [GET] /courses/teaching/me - Danh sách các khóa học do giảng viên phụ trách
router.get(
  "/teaching/me",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ query: queryCoursesSchema }),
  coursesController.getMyTeachingCourses,
);

// [POST] /courses - Tạo khóa học mới (Giảng viên / Admin)
router.post(
  "/",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: createCourseSchema }),
  coursesController.createCourse,
);

// [PUT] /courses/:id - Cập nhật thông tin khóa học (Tác giả / Admin)
router.put(
  "/:id",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdParamSchema, body: updateCourseSchema }),
  coursesController.updateCourse,
);

// [PATCH] /courses/:id/status - Đổi trạng thái xuất bản DRAFT / PUBLISHED / HIDDEN
router.patch(
  "/:id/status",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdParamSchema, body: updateCourseStatusSchema }),
  coursesController.updateCourseStatus,
);

// [DELETE] /courses/:id - Xóa khóa học khi chưa có học viên
router.delete(
  "/:id",
  authenticate,
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdParamSchema }),
  coursesController.deleteCourse,
);

// ==========================================
// 3. COURSE DETAIL ROUTE (Public / Preview)
// ==========================================

// [GET] /courses/:slug - Chi tiết khóa học theo slug (Kèm optionalAuthenticate để cho phép tác giả xem preview bản nháp)
router.get(
  "/:slug",
  optionalAuthenticate,
  validate({ params: courseSlugParamSchema }),
  coursesController.getCourseBySlug,
);

export default router;
