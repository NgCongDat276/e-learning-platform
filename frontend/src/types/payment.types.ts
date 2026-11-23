export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded';
export type CommissionSource = 'global' | 'lecturer' | 'course';
export type PaymentProvider = 'payos';

export interface OrderCourseSummary {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  level?: string;
  instructor?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface PayOSOrderDetails {
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  bin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  description: string | null;
  reference: string | null;
  transactionDateTime: string | null;
}

export interface OrderItem {
  id: string;
  orderCode: number;
  userId: string;
  courseId: string;
  lecturerId: string;
  provider: PaymentProvider;
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  lecturerNetAmount: number;
  commissionSource: CommissionSource;
  status: OrderStatus;
  payos: PayOSOrderDetails;
  expiredAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  firstLessonId?: string | null;
  course?: OrderCourseSummary;
  buyer?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface OrderStatusPollingResult {
  orderCode: number;
  status: OrderStatus;
  paidAt: string | null;
  expiredAt: string;
  courseSlug: string;
  firstLessonId: string | null;
}
