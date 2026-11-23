import type { CommissionSource, OrderStatus } from './payment.types';

export type PayoutStatus = 'pending' | 'completed' | 'rejected' | 'cancelled';
export type WalletTxType =
  | 'course_sale'
  | 'payout_hold'
  | 'payout_completed'
  | 'payout_refund'
  | 'adjustment';

export interface LecturerWallet {
  id: string | null;
  lecturerId: string;
  totalGrossRevenue: number;
  totalPlatformFee: number;
  totalNetEarned: number;
  availableBalance: number;
  pendingPayoutBalance: number;
  withdrawnBalance: number;
  updatedAt: string | null;
}

export interface BankAccountInfo {
  bankBin: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface LecturerRevenueOverview {
  wallet: LecturerWallet;
  paidOrdersCount: number;
  commission: {
    platformFeeRate: number;
    lecturerShareRate: number;
    source: CommissionSource;
  };
  minPayoutAmount: number;
  bankAccount: BankAccountInfo | null;
}

export interface LecturerPaidOrderItem {
  id: string;
  orderCode: number;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  buyer: {
    id: string;
    fullName: string;
    email: string;
  };
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  lecturerNetAmount: number;
  commissionSource: CommissionSource;
  paidAt: string | null;
}

export interface WalletTransactionItem {
  id: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId: string | null;
  payoutRequestId: string | null;
  description: string;
  createdAt: string;
}

export interface PayoutRequestItem {
  id: string;
  lecturerId: string;
  walletId: string;
  amount: number;
  status: PayoutStatus;
  bankBin: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  transferContent: string;
  vietqrUrl: string;
  lecturerNote: string | null;
  adminNote: string | null;
  transactionReference: string | null;
  proofImageUrl: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lecturer?: {
    id: string;
    fullName: string;
    email: string;
  };
  reviewer?: {
    id: string;
    fullName: string;
  };
}

export interface PlatformFinanceSettings {
  defaultPlatformFeeRate: number;
  minPayoutAmount: number;
  orderExpiryMinutes: number;
}

export interface AdminCommissionSettingsResponse {
  settings: PlatformFinanceSettings;
  lecturers: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    platformFeeRate: number | null;
  }>;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    status: string;
    platformFeeRate: number | null;
    lecturer: {
      id: string;
      fullName: string;
    };
  }>;
}

export interface AdminFinanceSummary {
  range: {
    fromTime: string;
    toTime: string;
  };
  period: {
    grossRevenue: number;
    adminProfit: number;
    lecturerNet: number;
    paidOrdersCount: number;
  };
  allTime: {
    grossRevenue: number;
    adminProfit: number;
    lecturerNet: number;
    paidOrdersCount: number;
  };
  pendingPayouts: {
    count: number;
    totalAmount: number;
  };
  dailyTrend: Array<{
    day_label: string;
    gross_amount: number;
    admin_profit: number;
    lecturer_net: number;
    orders_count: number;
  }>;
}

export interface AdminOrderItem {
  id: string;
  orderCode: number;
  status: OrderStatus;
  provider: string;
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  lecturerNetAmount: number;
  commissionSource: CommissionSource;
  payosReference: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  buyer: {
    id: string;
    fullName: string;
    email: string;
  };
  lecturer: {
    id: string;
    fullName: string;
    email: string;
  };
  paidAt: string | null;
  expiredAt: string;
  createdAt: string;
}
