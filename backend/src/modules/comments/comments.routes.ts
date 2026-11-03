import { Router } from "express";
import { commentsController } from "./comments.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { validate } from "../../common/middlewares/validate";
import {
  lessonCommentsParamSchema,
  commentIdParamSchema,
  getLessonCommentsQuerySchema,
  createCommentSchema,
  updateCommentSchema,
} from "./comments.schema";

const router = Router();

// Tất cả các route bình luận đều yêu cầu đăng nhập
router.use(authenticate);

// [GET] /comments/lessons/:lessonId - Lấy danh sách bình luận theo bài học
router.get(
  "/lessons/:lessonId",
  validate({
    params: lessonCommentsParamSchema,
    query: getLessonCommentsQuerySchema,
  }),
  commentsController.getLessonComments,
);

// [POST] /comments/lessons/:lessonId - Tạo bình luận mới hoặc trả lời trong bài học
router.post(
  "/lessons/:lessonId",
  validate({
    params: lessonCommentsParamSchema,
    body: createCommentSchema,
  }),
  commentsController.createComment,
);

// [PATCH] /comments/:commentId - Chỉnh sửa bình luận của chính mình
router.patch(
  "/:commentId",
  validate({
    params: commentIdParamSchema,
    body: updateCommentSchema,
  }),
  commentsController.updateComment,
);

// [DELETE] /comments/:commentId - Xóa bình luận (Tác giả / Giảng viên khóa học / Admin)
router.delete(
  "/:commentId",
  validate({
    params: commentIdParamSchema,
  }),
  commentsController.deleteComment,
);

export default router;

