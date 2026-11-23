import { Request, Response } from "express";
import { user_role } from "@prisma/client";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { paymentsService } from "./payments.service";
import { MyOrdersQueryInput } from "./payments.schema";

export class PaymentsController {
  /**
   * [POST] /payments/orders - Tạo đơn hàng thanh toán PayOS cho khóa học có phí
   */
  async createOrder(req: Request, res: Response): Promise<Response> {
    const result = await paymentsService.createOrder(
      req.user!.id,
      req.body.courseId,
    );
    return sendCreated(res, result, "Payment order created successfully");
  }

  /**
   * [GET] /payments/orders/my - Lịch sử đơn hàng của học viên
   */
  async getMyOrders(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as MyOrdersQueryInput;
    const result = await paymentsService.getMyOrders(req.user!.id, query);
    return sendSuccess(
      res,
      result.items,
      "Orders retrieved successfully",
      200,
      result.pagination,
    );
  }

  /**
   * [GET] /payments/orders/:orderCode - Chi tiết đơn hàng
   */
  async getOrderDetail(req: Request, res: Response): Promise<Response> {
    const orderCode = Number(req.params.orderCode);
    const result = await paymentsService.getOrderDetail(
      req.user!.id,
      req.user!.role as user_role,
      orderCode,
    );
    return sendSuccess(res, result, "Order detail retrieved successfully");
  }

  /**
   * [GET] /payments/orders/:orderCode/status - Kiểm tra nhanh trạng thái đơn hàng (Polling)
   */
  async getOrderStatus(req: Request, res: Response): Promise<Response> {
    const orderCode = Number(req.params.orderCode);
    const result = await paymentsService.getOrderStatus(
      req.user!.id,
      req.user!.role as user_role,
      orderCode,
    );
    return sendSuccess(res, result, "Order status retrieved successfully");
  }

  /**
   * [POST] /payments/orders/:orderCode/sync - Đối soát chủ động trạng thái với PayOS
   */
  async syncOrder(req: Request, res: Response): Promise<Response> {
    const orderCode = Number(req.params.orderCode);
    const result = await paymentsService.syncOrderWithPayOS(
      req.user!.id,
      req.user!.role as user_role,
      orderCode,
    );
    return sendSuccess(res, result, "Order synced with PayOS successfully");
  }

  /**
   * [POST] /payments/orders/:orderCode/cancel - Hủy đơn hàng pending
   */
  async cancelOrder(req: Request, res: Response): Promise<Response> {
    const orderCode = Number(req.params.orderCode);
    const result = await paymentsService.cancelOrder(
      req.user!.id,
      req.user!.role as user_role,
      orderCode,
    );
    return sendSuccess(res, result, "Order cancelled successfully");
  }

  /**
   * [POST] /payments/payos/webhook - Webhook callback từ PayOS (Public, xác thực bằng HMAC-SHA256)
   */
  async handlePayOSWebhook(req: Request, res: Response): Promise<Response> {
    const result = await paymentsService.handlePayOSWebhook(req.body);
    return sendSuccess(res, result, "Webhook processed successfully");
  }
}

export const paymentsController = new PaymentsController();
