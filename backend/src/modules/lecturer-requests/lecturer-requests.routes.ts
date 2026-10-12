import { Router } from "express";
import { lecturerRequestsController } from "./lecturer-requests.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import {
  queryLecturerRequestsSchema,
  reviewLecturerRequestSchema,
  requestIdParamSchema,
} from "./lecturer-requests.schema";
import { user_role } from "@prisma/client";

const router = Router();

// Tất cả các routes trong module này đều yêu cầu đăng nhập và chỉ Admin có quyền truy cập
router.use(authenticate, authorize(user_role.admin));

/**
 * 1. [GET] /lecturer-requests/stats - Thống kê số lượng đơn theo trạng thái (Đặt trước /:id)
 */
router.get("/stats", lecturerRequestsController.getRequestStats);

/**
 * 2. [GET] /lecturer-requests - Danh sách đơn xin làm giảng viên (Phân trang, lọc status, search)
 */
router.get(
  "/",
  validate({ query: queryLecturerRequestsSchema }),
  lecturerRequestsController.getRequestsList,
);

/**
 * 3. [PATCH] /lecturer-requests/:id/review - Phê duyệt hoặc từ chối đơn đăng ký
 */
router.patch(
  "/:id/review",
  validate({
    params: requestIdParamSchema,
    body: reviewLecturerRequestSchema,
  }),
  lecturerRequestsController.reviewRequest,
);

export default router;
