import { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { revenueService } from "./revenue.service";
import {
  AdminFinanceSummaryQueryInput,
  AdminOrdersQueryInput,
  AdminPayoutsQueryInput,
  LecturerOrdersQueryInput,
  LecturerPayoutsQueryInput,
  LecturerTransactionsQueryInput,
} from "./revenue.schema";

export class RevenueController {
  // ============================================================================
  // A. LECTURER ENDPOINTS
  // ============================================================================

  async getLecturerOverview(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.getLecturerOverview(req.user!.id);
    return sendSuccess(res, result, "Lecturer revenue overview retrieved");
  }

  async getLecturerOrders(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as LecturerOrdersQueryInput;
    const result = await revenueService.getLecturerOrders(req.user!.id, query);
    return sendSuccess(
      res,
      result.items,
      "Lecturer paid orders retrieved",
      200,
      result.pagination,
    );
  }

  async getLecturerTransactions(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const query = req.query as unknown as LecturerTransactionsQueryInput;
    const result = await revenueService.getLecturerTransactions(
      req.user!.id,
      query,
    );
    return sendSuccess(
      res,
      result.items,
      "Wallet transactions retrieved",
      200,
      result.pagination,
    );
  }

  async updateLecturerBankAccount(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const result = await revenueService.updateLecturerBankAccount(
      req.user!.id,
      req.body,
    );
    return sendSuccess(res, result, "Bank account updated successfully");
  }

  async getLecturerPayouts(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as LecturerPayoutsQueryInput;
    const result = await revenueService.getLecturerPayouts(
      req.user!.id,
      query,
    );
    return sendSuccess(
      res,
      result.items,
      "Lecturer payout requests retrieved",
      200,
      result.pagination,
    );
  }

  async createPayoutRequest(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.createPayoutRequest(
      req.user!.id,
      req.body,
    );
    return sendCreated(res, result, "Payout request created successfully");
  }

  async cancelPayoutRequest(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.cancelPayoutRequest(
      req.user!.id,
      req.params.id as string,
    );
    return sendSuccess(res, result, "Payout request cancelled successfully");
  }

  // ============================================================================
  // B. ADMIN ENDPOINTS
  // ============================================================================

  async getAdminSummary(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as AdminFinanceSummaryQueryInput;
    const result = await revenueService.getAdminFinanceSummary(query);
    return sendSuccess(res, result, "Admin finance summary retrieved");
  }

  async getAdminOrders(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as AdminOrdersQueryInput;
    const result = await revenueService.getAdminOrders(query);
    return sendSuccess(
      res,
      result.items,
      "Admin orders retrieved",
      200,
      result.pagination,
    );
  }

  async getAdminSettings(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.getAdminSettings();
    return sendSuccess(res, result, "Commission settings retrieved");
  }

  async updateAdminSettings(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.updateAdminSettings(
      req.user!.id,
      req.body,
    );
    return sendSuccess(res, result, "Platform settings updated successfully");
  }

  async updateLecturerCommission(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const result = await revenueService.updateLecturerCommission(
      req.params.lecturerId as string,
      req.body.platformFeeRate,
    );
    return sendSuccess(
      res,
      result,
      "Lecturer commission rate updated successfully",
    );
  }

  async updateCourseCommission(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.updateCourseCommission(
      req.params.courseId as string,
      req.body.platformFeeRate,
    );
    return sendSuccess(
      res,
      result,
      "Course commission rate updated successfully",
    );
  }

  async getAdminPayouts(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as AdminPayoutsQueryInput;
    const result = await revenueService.getAdminPayouts(query);
    return sendSuccess(
      res,
      result.items,
      "Admin payout requests retrieved",
      200,
      result.pagination,
    );
  }

  async completePayoutRequest(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.completePayoutRequest(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    return sendSuccess(res, result, "Payout request marked as completed");
  }

  async rejectPayoutRequest(req: Request, res: Response): Promise<Response> {
    const result = await revenueService.rejectPayoutRequest(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    return sendSuccess(res, result, "Payout request rejected");
  }
}

export const revenueController = new RevenueController();
