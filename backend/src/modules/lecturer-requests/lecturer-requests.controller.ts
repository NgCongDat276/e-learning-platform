import { Request, Response } from "express";
import { lecturerRequestsService } from "./lecturer-requests.service";
import { sendSuccess } from "../../common/utils/api-response";
import {
  QueryLecturerRequestsInput,
  ReviewLecturerRequestInput,
} from "./lecturer-requests.schema";

export class LecturerRequestsController {
  /**
   * [GET] /lecturer-requests - Danh sách đơn xin làm giảng viên (Admin)
   */
  async getRequestsList(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as QueryLecturerRequestsInput;
    const result = await lecturerRequestsService.getRequestsList(query);
    return sendSuccess(
      res,
      result,
      "Lấy danh sách đơn đăng ký giảng viên thành công",
    );
  }

  /**
   * [GET] /lecturer-requests/stats - Thống kê số lượng đơn theo trạng thái (Admin)
   */
  async getRequestStats(req: Request, res: Response): Promise<Response> {
    const stats = await lecturerRequestsService.getRequestStats();
    return sendSuccess(
      res,
      stats,
      "Lấy thống kê số lượng đơn đăng ký giảng viên thành công",
    );
  }

  /**
   * [PATCH] /lecturer-requests/:id/review - Phê duyệt hoặc từ chối đơn đăng ký (Admin)
   */
  async reviewRequest(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const data = req.body as ReviewLecturerRequestInput;

    const result = await lecturerRequestsService.reviewRequest(
      id,
      adminId,
      data,
    );

    const message =
      data.status === "approved"
        ? "Phê duyệt giảng viên thành công! Người dùng đã được cấp quyền giảng dạy."
        : "Đã từ chối đơn đăng ký giảng viên.";

    return sendSuccess(res, result, message);
  }
}

export const lecturerRequestsController = new LecturerRequestsController();
