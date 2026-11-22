import { Router } from "express";
import { user_role } from "@prisma/client";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import { revenueController } from "./revenue.controller";
import {
  adminFinanceSummaryQuerySchema,
  adminOrdersQuerySchema,
  adminPayoutsQuerySchema,
  completePayoutSchema,
  courseIdParamSchema,
  createPayoutSchema,
  lecturerIdParamSchema,
  lecturerOrdersQuerySchema,
  lecturerPayoutsQuerySchema,
  lecturerTransactionsQuerySchema,
  payoutIdParamSchema,
  rejectPayoutSchema,
  updateBankAccountSchema,
  updateCommissionRateSchema,
  updatePlatformSettingsSchema,
} from "./revenue.schema";

const router = Router();

router.use(authenticate);

// ============================================================================
// LECTURER ROUTES (Giảng viên & Admin)
// ============================================================================

router.get(
  "/lecturer/overview",
  authorize(user_role.lecturer, user_role.admin),
  revenueController.getLecturerOverview,
);

router.get(
  "/lecturer/orders",
  authorize(user_role.lecturer, user_role.admin),
  validate({ query: lecturerOrdersQuerySchema }),
  revenueController.getLecturerOrders,
);

router.get(
  "/lecturer/transactions",
  authorize(user_role.lecturer, user_role.admin),
  validate({ query: lecturerTransactionsQuerySchema }),
  revenueController.getLecturerTransactions,
);

router.patch(
  "/lecturer/bank-account",
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: updateBankAccountSchema }),
  revenueController.updateLecturerBankAccount,
);

router.get(
  "/lecturer/payouts",
  authorize(user_role.lecturer, user_role.admin),
  validate({ query: lecturerPayoutsQuerySchema }),
  revenueController.getLecturerPayouts,
);

router.post(
  "/lecturer/payouts",
  authorize(user_role.lecturer, user_role.admin),
  validate({ body: createPayoutSchema }),
  revenueController.createPayoutRequest,
);

router.post(
  "/lecturer/payouts/:id/cancel",
  authorize(user_role.lecturer, user_role.admin),
  validate({ params: payoutIdParamSchema }),
  revenueController.cancelPayoutRequest,
);

// ============================================================================
// ADMIN ROUTES (Quản trị viên)
// ============================================================================

router.get(
  "/admin/summary",
  authorize(user_role.admin),
  validate({ query: adminFinanceSummaryQuerySchema }),
  revenueController.getAdminSummary,
);

router.get(
  "/admin/orders",
  authorize(user_role.admin),
  validate({ query: adminOrdersQuerySchema }),
  revenueController.getAdminOrders,
);

router.get(
  "/admin/settings",
  authorize(user_role.admin),
  revenueController.getAdminSettings,
);

router.patch(
  "/admin/settings",
  authorize(user_role.admin),
  validate({ body: updatePlatformSettingsSchema }),
  revenueController.updateAdminSettings,
);

router.patch(
  "/admin/lecturers/:lecturerId/commission",
  authorize(user_role.admin),
  validate({
    params: lecturerIdParamSchema,
    body: updateCommissionRateSchema,
  }),
  revenueController.updateLecturerCommission,
);

router.patch(
  "/admin/courses/:courseId/commission",
  authorize(user_role.admin),
  validate({
    params: courseIdParamSchema,
    body: updateCommissionRateSchema,
  }),
  revenueController.updateCourseCommission,
);

router.get(
  "/admin/payouts",
  authorize(user_role.admin),
  validate({ query: adminPayoutsQuerySchema }),
  revenueController.getAdminPayouts,
);

router.post(
  "/admin/payouts/:id/complete",
  authorize(user_role.admin),
  validate({ params: payoutIdParamSchema, body: completePayoutSchema }),
  revenueController.completePayoutRequest,
);

router.post(
  "/admin/payouts/:id/reject",
  authorize(user_role.admin),
  validate({ params: payoutIdParamSchema, body: rejectPayoutSchema }),
  revenueController.rejectPayoutRequest,
);

export default router;
