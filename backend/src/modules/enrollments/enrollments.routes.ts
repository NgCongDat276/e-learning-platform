import { Router } from "express";
import { enrollmentsController } from "./enrollments.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { user_role } from "@prisma/client";
import {
  courseIdentifierParamSchema,
  lessonIdParamSchema,
  updateLessonProgressSchema,
} from "./enrollments.schema";

const router = Router();

// Tất cả các route enrollment đều yêu cầu đăng nhập
router.use(authenticate);

// [GET] /enrollments/my-courses - Danh sách khóa học học viên đã ghi danh
router.get("/my-courses", enrollmentsController.getMyCourses);

// [POST] /enrollments/courses/:courseId/enroll - Ghi danh khóa học
router.post(
  "/courses/:courseId/enroll",
  validate({ params: courseIdentifierParamSchema }),
  enrollmentsController.enroll,
);

// [GET] /enrollments/courses/:courseId/status - Kiểm tra trạng thái ghi danh
router.get(
  "/courses/:courseId/status",
  validate({ params: courseIdentifierParamSchema }),
  enrollmentsController.getStatus,
);

// [GET] /enrollments/courses/:courseId/classroom - Cây bài học phòng học tập trung
router.get(
  "/courses/:courseId/classroom",
  validate({ params: courseIdentifierParamSchema }),
  enrollmentsController.getClassroomData,
);

// [GET] /enrollments/courses/:courseId/students - Giảng viên xem danh sách học viên và tiến độ
router.get(
  "/courses/:courseId/students",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: courseIdentifierParamSchema }),
  enrollmentsController.getCourseStudents,
);

// [POST] /enrollments/lessons/:lessonId/complete - Đánh dấu bài học đã hoàn thành
router.post(
  "/lessons/:lessonId/complete",
  validate({ params: lessonIdParamSchema }),
  enrollmentsController.completeLesson,
);

// [DELETE] /enrollments/lessons/:lessonId/complete - Hủy đánh dấu hoàn thành bài học
router.delete(
  "/lessons/:lessonId/complete",
  validate({ params: lessonIdParamSchema }),
  enrollmentsController.uncompleteLesson,
);

// [PATCH] /enrollments/lessons/:lessonId/progress - Cập nhật vị trí xem video
router.patch(
  "/lessons/:lessonId/progress",
  validate({
    params: lessonIdParamSchema,
    body: updateLessonProgressSchema,
  }),
  enrollmentsController.updateProgress,
);

export default router;
