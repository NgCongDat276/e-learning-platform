import axiosClient from './axios-client';
import type { ApiResponse } from '../types/api';
import type { OrderStatus } from '../types/payment.types';
import type {
  AdminCommissionSettingsResponse,
  AdminFinanceSummary,
  AdminOrderItem,
  BankAccountInfo,
  LecturerPaidOrderItem,
  LecturerRevenueOverview,
  PayoutRequestItem,
  PayoutStatus,
  PlatformFinanceSettings,
  WalletTransactionItem,
  WalletTxType,
} from '../types/revenue.types';

// ============================================================================
// LECTURER APIs
// ============================================================================

export const getLecturerRevenueOverviewApi = async (): Promise<
  ApiResponse<LecturerRevenueOverview>
> => {
  const response = (await axiosClient.get(
    '/revenue/lecturer/overview'
  )) as unknown as ApiResponse<LecturerRevenueOverview>;
  return response;
};

export const getLecturerPaidOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  courseId?: string;
}): Promise<ApiResponse<LecturerPaidOrderItem[]>> => {
  const response = (await axiosClient.get('/revenue/lecturer/orders', {
    params,
  })) as unknown as ApiResponse<LecturerPaidOrderItem[]>;
  return response;
};

export const getLecturerTransactionsApi = async (params?: {
  page?: number;
  limit?: number;
  type?: WalletTxType;
}): Promise<ApiResponse<WalletTransactionItem[]>> => {
  const response = (await axiosClient.get('/revenue/lecturer/transactions', {
    params,
  })) as unknown as ApiResponse<WalletTransactionItem[]>;
  return response;
};

export const updateLecturerBankAccountApi = async (
  payload: BankAccountInfo
): Promise<ApiResponse<BankAccountInfo>> => {
  const response = (await axiosClient.patch(
    '/revenue/lecturer/bank-account',
    payload
  )) as unknown as ApiResponse<BankAccountInfo>;
  return response;
};

export const getLecturerPayoutsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: PayoutStatus;
}): Promise<ApiResponse<PayoutRequestItem[]>> => {
  const response = (await axiosClient.get('/revenue/lecturer/payouts', {
    params,
  })) as unknown as ApiResponse<PayoutRequestItem[]>;
  return response;
};

export const createPayoutRequestApi = async (payload: {
  amount: number;
  lecturerNote?: string;
}): Promise<ApiResponse<PayoutRequestItem>> => {
  const response = (await axiosClient.post(
    '/revenue/lecturer/payouts',
    payload
  )) as unknown as ApiResponse<PayoutRequestItem>;
  return response;
};

export const cancelPayoutRequestApi = async (
  payoutId: string
): Promise<ApiResponse<PayoutRequestItem>> => {
  const response = (await axiosClient.post(
    `/revenue/lecturer/payouts/${payoutId}/cancel`
  )) as unknown as ApiResponse<PayoutRequestItem>;
  return response;
};

// ============================================================================
// ADMIN APIs
// ============================================================================

export const getAdminFinanceSummaryApi = async (params?: {
  fromTime?: string;
  toTime?: string;
}): Promise<ApiResponse<AdminFinanceSummary>> => {
  const response = (await axiosClient.get('/revenue/admin/summary', {
    params,
  })) as unknown as ApiResponse<AdminFinanceSummary>;
  return response;
};

export const getAdminOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}): Promise<ApiResponse<AdminOrderItem[]>> => {
  const response = (await axiosClient.get('/revenue/admin/orders', {
    params,
  })) as unknown as ApiResponse<AdminOrderItem[]>;
  return response;
};

export const getAdminCommissionSettingsApi = async (): Promise<
  ApiResponse<AdminCommissionSettingsResponse>
> => {
  const response = (await axiosClient.get(
    '/revenue/admin/settings'
  )) as unknown as ApiResponse<AdminCommissionSettingsResponse>;
  return response;
};

export const updateAdminPlatformSettingsApi = async (
  payload: Partial<PlatformFinanceSettings>
): Promise<ApiResponse<PlatformFinanceSettings>> => {
  const response = (await axiosClient.patch(
    '/revenue/admin/settings',
    payload
  )) as unknown as ApiResponse<PlatformFinanceSettings>;
  return response;
};

export const updateLecturerCommissionApi = async (
  lecturerId: string,
  platformFeeRate: number | null
): Promise<ApiResponse<{ lecturerId: string; fullName: string; platformFeeRate: number | null }>> => {
  const response = (await axiosClient.patch(
    `/revenue/admin/lecturers/${lecturerId}/commission`,
    { platformFeeRate }
  )) as unknown as ApiResponse<{
    lecturerId: string;
    fullName: string;
    platformFeeRate: number | null;
  }>;
  return response;
};

export const updateCourseCommissionApi = async (
  courseId: string,
  platformFeeRate: number | null
): Promise<ApiResponse<{ courseId: string; title: string; platformFeeRate: number | null }>> => {
  const response = (await axiosClient.patch(
    `/revenue/admin/courses/${courseId}/commission`,
    { platformFeeRate }
  )) as unknown as ApiResponse<{
    courseId: string;
    title: string;
    platformFeeRate: number | null;
  }>;
  return response;
};

export const getAdminPayoutsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: PayoutStatus;
}): Promise<ApiResponse<PayoutRequestItem[]>> => {
  const response = (await axiosClient.get('/revenue/admin/payouts', {
    params,
  })) as unknown as ApiResponse<PayoutRequestItem[]>;
  return response;
};

export const completeAdminPayoutApi = async (
  payoutId: string,
  payload: {
    transactionReference: string;
    proofImageUrl?: string;
    adminNote?: string;
  }
): Promise<ApiResponse<PayoutRequestItem>> => {
  const response = (await axiosClient.post(
    `/revenue/admin/payouts/${payoutId}/complete`,
    payload
  )) as unknown as ApiResponse<PayoutRequestItem>;
  return response;
};

export const rejectAdminPayoutApi = async (
  payoutId: string,
  payload: { adminNote: string }
): Promise<ApiResponse<PayoutRequestItem>> => {
  const response = (await axiosClient.post(
    `/revenue/admin/payouts/${payoutId}/reject`,
    payload
  )) as unknown as ApiResponse<PayoutRequestItem>;
  return response;
};
