import { commission_source, user_role } from "@prisma/client";
import prisma from "../../prisma";

export const DEFAULT_PLATFORM_FEE_RATE = 30;
export const DEFAULT_MIN_PAYOUT_AMOUNT = 10_000;
export const DEFAULT_ORDER_EXPIRY_MINUTES = 15;

export interface PlatformSettingsValues {
  defaultPlatformFeeRate: number;
  minPayoutAmount: number;
  orderExpiryMinutes: number;
}

export interface CommissionResolution {
  platformFeeRate: number;
  commissionSource: commission_source;
}

export interface RevenueSplitResult {
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  lecturerNetAmount: number;
  commissionSource: commission_source;
}

/**
 * Đọc cấu hình tài chính từ bảng platform_settings và fallback về giá trị mặc định.
 */
export async function getPlatformSettings(): Promise<PlatformSettingsValues> {
  const rows = await prisma.platform_settings.findMany({
    where: {
      key: {
        in: [
          "default_platform_fee_rate",
          "min_payout_amount",
          "order_expiry_minutes",
        ],
      },
    },
  });

  const map = new Map(rows.map((r) => [r.key, r.value]));

  const parseSettingNumber = (
    key: string,
    fallback: number,
    min: number,
    max?: number,
  ): number => {
    const raw = map.get(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min) return fallback;
    if (max !== undefined && parsed > max) return fallback;
    return parsed;
  };

  return {
    defaultPlatformFeeRate: parseSettingNumber(
      "default_platform_fee_rate",
      DEFAULT_PLATFORM_FEE_RATE,
      0,
      100,
    ),
    minPayoutAmount: parseSettingNumber(
      "min_payout_amount",
      DEFAULT_MIN_PAYOUT_AMOUNT,
      0,
    ),
    orderExpiryMinutes: parseSettingNumber(
      "order_expiry_minutes",
      DEFAULT_ORDER_EXPIRY_MINUTES,
      1,
      1440,
    ),
  };
}

/**
 * Xác định tỉ lệ ăn chia cho một khóa học theo thứ tự ưu tiên 3 tầng:
 * 1. Khóa học do Admin tạo -> 100% thuộc nền tảng.
 * 2. Tỉ lệ riêng của Khóa học (courses.platform_fee_rate).
 * 3. Tỉ lệ riêng của Giảng viên (teacher_profile.platform_fee_rate).
 * 4. Tỉ lệ mặc định toàn hệ thống (platform_settings.default_platform_fee_rate).
 */
export async function resolveCourseCommission(params: {
  coursePlatformFeeRate: unknown;
  lecturerPlatformFeeRate: unknown;
  lecturerRole?: user_role | null;
  defaultPlatformFeeRate?: number;
}): Promise<CommissionResolution> {
  if (params.lecturerRole === user_role.admin) {
    return {
      platformFeeRate: 100,
      commissionSource: commission_source.global,
    };
  }

  if (
    params.coursePlatformFeeRate !== null &&
    params.coursePlatformFeeRate !== undefined
  ) {
    const rate = Number(params.coursePlatformFeeRate);
    if (Number.isFinite(rate) && rate >= 0 && rate <= 100) {
      return {
        platformFeeRate: rate,
        commissionSource: commission_source.course,
      };
    }
  }

  if (
    params.lecturerPlatformFeeRate !== null &&
    params.lecturerPlatformFeeRate !== undefined
  ) {
    const rate = Number(params.lecturerPlatformFeeRate);
    if (Number.isFinite(rate) && rate >= 0 && rate <= 100) {
      return {
        platformFeeRate: rate,
        commissionSource: commission_source.lecturer,
      };
    }
  }

  const defaultRate =
    params.defaultPlatformFeeRate ??
    (await getPlatformSettings()).defaultPlatformFeeRate;

  return {
    platformFeeRate: defaultRate,
    commissionSource: commission_source.global,
  };
}

/**
 * Tính toán phân chia số tiền (VND) đảm bảo:
 * platformFeeAmount + lecturerNetAmount === grossAmount (không lệch 1 VND).
 */
export function calculateRevenueSplit(
  grossAmount: number,
  platformFeeRate: number,
  commissionSource: commission_source,
): RevenueSplitResult {
  const normalizedGross = Math.max(0, Math.round(grossAmount));
  const clampedRate = Math.min(100, Math.max(0, platformFeeRate));
  const platformFeeAmount = Math.round((normalizedGross * clampedRate) / 100);
  const lecturerNetAmount = normalizedGross - platformFeeAmount;

  return {
    grossAmount: normalizedGross,
    platformFeeRate: Number(clampedRate.toFixed(2)),
    platformFeeAmount,
    lecturerNetAmount,
    commissionSource,
  };
}
