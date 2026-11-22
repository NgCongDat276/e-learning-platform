import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate";
import { validate } from "../../common/middlewares/validate";
import { paymentsController } from "./payments.controller";
import {
  createOrderSchema,
  myOrdersQuerySchema,
  orderCodeParamSchema,
} from "./payments.schema";

const router = Router();

// Webhook public từ PayOS (được bảo vệ bằng chữ ký HMAC-SHA256)
router.post("/payos/webhook", paymentsController.handlePayOSWebhook);

// Các route còn lại đều yêu cầu đăng nhập
router.use(authenticate);

// [POST] /payments/orders - Tạo đơn hàng thanh toán PayOS
router.post(
  "/orders",
  validate({ body: createOrderSchema }),
  paymentsController.createOrder,
);

// [GET] /payments/orders/my - Lịch sử đơn hàng của học viên
router.get(
  "/orders/my",
  validate({ query: myOrdersQuerySchema }),
  paymentsController.getMyOrders,
);

// [GET] /payments/orders/:orderCode - Chi tiết đơn hàng
router.get(
  "/orders/:orderCode",
  validate({ params: orderCodeParamSchema }),
  paymentsController.getOrderDetail,
);

// [GET] /payments/orders/:orderCode/status - Trạng thái đơn hàng (Polling)
router.get(
  "/orders/:orderCode/status",
  validate({ params: orderCodeParamSchema }),
  paymentsController.getOrderStatus,
);

// [POST] /payments/orders/:orderCode/sync - Đối soát chủ động với PayOS
router.post(
  "/orders/:orderCode/sync",
  validate({ params: orderCodeParamSchema }),
  paymentsController.syncOrder,
);

// [POST] /payments/orders/:orderCode/cancel - Hủy đơn hàng pending
router.post(
  "/orders/:orderCode/cancel",
  validate({ params: orderCodeParamSchema }),
  paymentsController.cancelOrder,
);

export default router;
