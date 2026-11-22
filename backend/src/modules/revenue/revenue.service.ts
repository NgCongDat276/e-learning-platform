import {
  Prisma,
  commission_source,
  order_status,
  payout_status,
  user_role,
  wallet_tx_type,
} from "@prisma/client";
import prisma from "../../prisma";
import {
  BadRequestError,
  NotFoundError,
} from "../../common/errors/app-error";
import { PaginationMeta } from "../../common/utils/api-response";
import { getPlatformSettings } from "./commission.helper";
import {
  AdminFinanceSummaryQueryInput,
  AdminOrdersQueryInput,
  AdminPayoutsQueryInput,
  CompletePayoutInput,
  CreatePayoutInput,
  LecturerOrdersQueryInput,
  LecturerPayoutsQueryInput,
  LecturerTransactionsQueryInput,
  RejectPayoutInput,
  UpdateBankAccountInput,
  UpdatePlatformSettingsInput,
} from "./revenue.schema";

const DEFAULT_RANGE_MS = 30 * 24 * 60 * 60 * 1000;
const REPORT_TIMEZONE = "Asia/Ho_Chi_Minh";

export class RevenueService {
  private buildPagination(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Tạo URL ảnh VietQR chuẩn Napas 24/7 để Admin quét chuyển khoản trả Giảng viên.
   */
  private buildVietQRUrl(params: {
    bankBin: string;
    bankAccountNumber: string;
    amount: number;
    transferContent: string;
    bankAccountName: string;
  }): string {
    const query = new URLSearchParams({
      amount: String(Math.round(params.amount)),
      addInfo: params.transferContent,
      accountName: params.bankAccountName,
    });
    return `https://img.vietqr.io/image/${encodeURIComponent(params.bankBin)}-${encodeURIComponent(params.bankAccountNumber)}-compact2.png?${query.toString()}`;
  }

  private generateTransferContent(): string {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LMS PAYOUT ${code}`;
  }

  private serializeWallet(wallet: any) {
    return {
      id: wallet.id,
      lecturerId: wallet.lecturer_id,
      totalGrossRevenue: Number(wallet.total_gross_revenue),
      totalPlatformFee: Number(wallet.total_platform_fee),
      totalNetEarned: Number(wallet.total_net_earned),
      availableBalance: Number(wallet.available_balance),
      pendingPayoutBalance: Number(wallet.pending_payout_balance),
      withdrawnBalance: Number(wallet.withdrawn_balance),
      updatedAt: wallet.updated_at,
    };
  }

  private serializePayout(payout: any) {
    const amount = Number(payout.amount);
    return {
      id: payout.id,
      lecturerId: payout.lecturer_id,
      walletId: payout.wallet_id,
      amount,
      status: payout.status,
      bankBin: payout.bank_bin,
      bankName: payout.bank_name,
      bankAccountNumber: payout.bank_account_number,
      bankAccountName: payout.bank_account_name,
      transferContent: payout.transfer_content,
      vietqrUrl: this.buildVietQRUrl({
        bankBin: payout.bank_bin,
        bankAccountNumber: payout.bank_account_number,
        amount,
        transferContent: payout.transfer_content,
        bankAccountName: payout.bank_account_name,
      }),
      lecturerNote: payout.lecturer_note,
      adminNote: payout.admin_note,
      transactionReference: payout.transaction_reference,
      proofImageUrl: payout.proof_image_url,
      reviewedBy: payout.reviewed_by,
      reviewedAt: payout.reviewed_at,
      completedAt: payout.completed_at,
      createdAt: payout.created_at,
      updatedAt: payout.updated_at,
      ...(payout.lecturer && {
        lecturer: {
          id: payout.lecturer.id,
          fullName: payout.lecturer.full_name,
          email: payout.lecturer.email,
        },
      }),
      ...(payout.reviewer && {
        reviewer: {
          id: payout.reviewer.id,
          fullName: payout.reviewer.full_name,
        },
      }),
    };
  }

  // ============================================================================
  // A. NHÓM API CHO GIẢNG VIÊN (LECTURER)
  // ============================================================================

  async getLecturerOverview(lecturerId: string) {
    const [walletRecord, teacherProfile, settings, paidOrdersCount] =
      await Promise.all([
        prisma.lecturer_wallets.findUnique({
          where: { lecturer_id: lecturerId },
        }),
        prisma.teacher_profile.findUnique({
          where: { user_id: lecturerId },
          select: {
            platform_fee_rate: true,
            bank_bin: true,
            bank_name: true,
            bank_account_number: true,
            bank_account_name: true,
          },
        }),
        getPlatformSettings(),
        prisma.orders.count({
          where: {
            lecturer_id: lecturerId,
            status: order_status.paid,
          },
        }),
      ]);

    const wallet = walletRecord
      ? this.serializeWallet(walletRecord)
      : {
          id: null,
          lecturerId,
          totalGrossRevenue: 0,
          totalPlatformFee: 0,
          totalNetEarned: 0,
          availableBalance: 0,
          pendingPayoutBalance: 0,
          withdrawnBalance: 0,
          updatedAt: null,
        };

    const hasCustomRate =
      teacherProfile?.platform_fee_rate !== null &&
      teacherProfile?.platform_fee_rate !== undefined;

    const effectivePlatformFeeRate = hasCustomRate
      ? Number(teacherProfile!.platform_fee_rate)
      : settings.defaultPlatformFeeRate;

    return {
      wallet,
      paidOrdersCount,
      commission: {
        platformFeeRate: effectivePlatformFeeRate,
        lecturerShareRate: Number((100 - effectivePlatformFeeRate).toFixed(2)),
        source: hasCustomRate
          ? commission_source.lecturer
          : commission_source.global,
      },
      minPayoutAmount: settings.minPayoutAmount,
      bankAccount: teacherProfile?.bank_account_number
        ? {
            bankBin: teacherProfile.bank_bin,
            bankName: teacherProfile.bank_name,
            bankAccountNumber: teacherProfile.bank_account_number,
            bankAccountName: teacherProfile.bank_account_name,
          }
        : null,
    };
  }

  async getLecturerOrders(lecturerId: string, query: LecturerOrdersQueryInput) {
    const where: Prisma.ordersWhereInput = {
      lecturer_id: lecturerId,
      status: order_status.paid,
      ...(query.courseId && { course_id: query.courseId }),
      ...((query.fromTime || query.toTime) && {
        paid_at: {
          ...(query.fromTime && { gte: query.fromTime }),
          ...(query.toTime && { lte: query.toTime }),
        },
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { paid_at: "desc" },
        skip,
        take: query.limit,
        include: {
          courses: {
            select: { id: true, title: true, slug: true },
          },
          buyer: {
            select: { id: true, full_name: true, email: true },
          },
        },
      }),
      prisma.orders.count({ where }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        orderCode: Number(o.order_code),
        course: o.courses,
        buyer: {
          id: o.buyer.id,
          fullName: o.buyer.full_name,
          email: o.buyer.email,
        },
        grossAmount: Number(o.gross_amount),
        platformFeeRate: Number(o.platform_fee_rate),
        platformFeeAmount: Number(o.platform_fee_amount),
        lecturerNetAmount: Number(o.lecturer_net_amount),
        commissionSource: o.commission_source,
        paidAt: o.paid_at,
      })),
      pagination: this.buildPagination(query.page, query.limit, total),
    };
  }

  async getLecturerTransactions(
    lecturerId: string,
    query: LecturerTransactionsQueryInput,
  ) {
    const where: Prisma.wallet_transactionsWhereInput = {
      lecturer_id: lecturerId,
      ...(query.type && { type: query.type }),
    };

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.wallet_transactions.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.wallet_transactions.count({ where }),
    ]);

    return {
      items: rows.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        balanceBefore: Number(tx.balance_before),
        balanceAfter: Number(tx.balance_after),
        orderId: tx.order_id,
        payoutRequestId: tx.payout_request_id,
        description: tx.description,
        createdAt: tx.created_at,
      })),
      pagination: this.buildPagination(query.page, query.limit, total),
    };
  }

  async updateLecturerBankAccount(
    lecturerId: string,
    input: UpdateBankAccountInput,
  ) {
    const normalizedName = input.bankAccountName.trim().toUpperCase();
    const normalizedNumber = input.bankAccountNumber.trim();

    const profile = await prisma.teacher_profile.upsert({
      where: { user_id: lecturerId },
      create: {
        user_id: lecturerId,
        bank_bin: input.bankBin,
        bank_name: input.bankName,
        bank_account_number: normalizedNumber,
        bank_account_name: normalizedName,
      },
      update: {
        bank_bin: input.bankBin,
        bank_name: input.bankName,
        bank_account_number: normalizedNumber,
        bank_account_name: normalizedName,
        updated_at: new Date(),
      },
      select: {
        bank_bin: true,
        bank_name: true,
        bank_account_number: true,
        bank_account_name: true,
      },
    });

    return {
      bankBin: profile.bank_bin,
      bankName: profile.bank_name,
      bankAccountNumber: profile.bank_account_number,
      bankAccountName: profile.bank_account_name,
    };
  }

  async getLecturerPayouts(
    lecturerId: string,
    query: LecturerPayoutsQueryInput,
  ) {
    const where: Prisma.payout_requestsWhereInput = {
      lecturer_id: lecturerId,
      ...(query.status && { status: query.status }),
    };

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.payout_requests.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.payout_requests.count({ where }),
    ]);

    return {
      items: rows.map((p) => this.serializePayout(p)),
      pagination: this.buildPagination(query.page, query.limit, total),
    };
  }

  async createPayoutRequest(lecturerId: string, input: CreatePayoutInput) {
    const amount = Math.round(input.amount);
    const settings = await getPlatformSettings();

    if (amount < settings.minPayoutAmount) {
      throw new BadRequestError(
        `Số tiền rút tối thiểu là ${settings.minPayoutAmount.toLocaleString("vi-VN")} ₫`,
      );
    }

    const teacherProfile = await prisma.teacher_profile.findUnique({
      where: { user_id: lecturerId },
      select: {
        bank_bin: true,
        bank_name: true,
        bank_account_number: true,
        bank_account_name: true,
      },
    });

    if (
      !teacherProfile?.bank_bin ||
      !teacherProfile.bank_name ||
      !teacherProfile.bank_account_number ||
      !teacherProfile.bank_account_name
    ) {
      throw new BadRequestError(
        "Vui lòng cấu hình đầy đủ thông tin tài khoản ngân hàng trước khi tạo yêu cầu rút tiền.",
      );
    }

    const transferContent = this.generateTransferContent();

    const createdPayout = await prisma.$transaction(async (tx) => {
      const wallet = await tx.lecturer_wallets.findUnique({
        where: { lecturer_id: lecturerId },
      });

      if (!wallet) {
        throw new BadRequestError("Số dư khả dụng của bạn hiện bằng 0 ₫");
      }

      const available = Number(wallet.available_balance);
      const pending = Number(wallet.pending_payout_balance);

      if (amount > available) {
        throw new BadRequestError(
          `Số dư khả dụng không đủ (hiện có ${available.toLocaleString("vi-VN")} ₫)`,
        );
      }

      const balanceAfter = available - amount;
      const now = new Date();

      await tx.lecturer_wallets.update({
        where: { id: wallet.id },
        data: {
          available_balance: new Prisma.Decimal(balanceAfter),
          pending_payout_balance: new Prisma.Decimal(pending + amount),
          updated_at: now,
        },
      });

      const payout = await tx.payout_requests.create({
        data: {
          lecturer_id: lecturerId,
          wallet_id: wallet.id,
          amount: new Prisma.Decimal(amount),
          status: payout_status.pending,
          bank_bin: teacherProfile.bank_bin!,
          bank_name: teacherProfile.bank_name!,
          bank_account_number: teacherProfile.bank_account_number!,
          bank_account_name: teacherProfile.bank_account_name!,
          transfer_content: transferContent,
          lecturer_note: input.lecturerNote || null,
        },
      });

      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          lecturer_id: lecturerId,
          type: wallet_tx_type.payout_hold,
          amount: new Prisma.Decimal(-amount),
          balance_before: new Prisma.Decimal(available),
          balance_after: new Prisma.Decimal(balanceAfter),
          payout_request_id: payout.id,
          description: `Tạm giữ tiền cho yêu cầu rút ${amount.toLocaleString("vi-VN")} ₫ (${transferContent})`,
        },
      });

      return payout;
    });

    return this.serializePayout(createdPayout);
  }

  async cancelPayoutRequest(lecturerId: string, payoutId: string) {
    const updatedPayout = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.payout_requests.updateMany({
        where: {
          id: payoutId,
          lecturer_id: lecturerId,
          status: payout_status.pending,
        },
        data: {
          status: payout_status.cancelled,
          updated_at: now,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(
          "Không thể hủy yêu cầu rút tiền này (không tồn tại hoặc đã được xử lý).",
        );
      }

      const payout = await tx.payout_requests.findUniqueOrThrow({
        where: { id: payoutId },
      });
      const wallet = await tx.lecturer_wallets.findUniqueOrThrow({
        where: { id: payout.wallet_id },
      });

      const amount = Number(payout.amount);
      const balanceBefore = Number(wallet.available_balance);
      const balanceAfter = balanceBefore + amount;
      const pendingAfter = Math.max(
        0,
        Number(wallet.pending_payout_balance) - amount,
      );

      await tx.lecturer_wallets.update({
        where: { id: wallet.id },
        data: {
          available_balance: new Prisma.Decimal(balanceAfter),
          pending_payout_balance: new Prisma.Decimal(pendingAfter),
          updated_at: now,
        },
      });

      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          lecturer_id: lecturerId,
          type: wallet_tx_type.payout_refund,
          amount: new Prisma.Decimal(amount),
          balance_before: new Prisma.Decimal(balanceBefore),
          balance_after: new Prisma.Decimal(balanceAfter),
          payout_request_id: payout.id,
          description: `Hoàn lại ${amount.toLocaleString("vi-VN")} ₫ do giảng viên hủy yêu cầu rút tiền`,
        },
      });

      return payout;
    });

    return this.serializePayout(updatedPayout);
  }

  // ============================================================================
  // B. NHÓM API CHO ADMIN
  // ============================================================================

  async getAdminFinanceSummary(query: AdminFinanceSummaryQueryInput) {
    const toTime = query.toTime ?? new Date();
    const fromTime =
      query.fromTime ?? new Date(toTime.getTime() - DEFAULT_RANGE_MS);

    if (fromTime > toTime) {
      throw new BadRequestError("fromTime must be less than or equal to toTime");
    }

    const tzRaw = Prisma.raw(`'${REPORT_TIMEZONE}'`);

    const [periodAgg, pendingPayoutAgg, allTimeAgg, dailyTrend] =
      await Promise.all([
        prisma.orders.aggregate({
          where: {
            status: order_status.paid,
            paid_at: { gte: fromTime, lte: toTime },
          },
          _sum: {
            gross_amount: true,
            platform_fee_amount: true,
            lecturer_net_amount: true,
          },
          _count: { _all: true },
        }),
        prisma.payout_requests.aggregate({
          where: { status: payout_status.pending },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.orders.aggregate({
          where: { status: order_status.paid },
          _sum: {
            gross_amount: true,
            platform_fee_amount: true,
            lecturer_net_amount: true,
          },
          _count: { _all: true },
        }),
        prisma.$queryRaw<
          Array<{
            day_label: string;
            gross_amount: number;
            admin_profit: number;
            lecturer_net: number;
            orders_count: number;
          }>
        >`
          SELECT
            TO_CHAR(DATE_TRUNC('day', paid_at AT TIME ZONE ${tzRaw}), 'YYYY-MM-DD') AS day_label,
            COALESCE(SUM(gross_amount), 0)::float8 AS gross_amount,
            COALESCE(SUM(platform_fee_amount), 0)::float8 AS admin_profit,
            COALESCE(SUM(lecturer_net_amount), 0)::float8 AS lecturer_net,
            COUNT(*)::int AS orders_count
          FROM orders
          WHERE status = 'paid'
            AND paid_at >= ${fromTime}
            AND paid_at <= ${toTime}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ]);

    return {
      range: {
        fromTime: fromTime.toISOString(),
        toTime: toTime.toISOString(),
      },
      period: {
        grossRevenue: Number(periodAgg._sum.gross_amount || 0),
        adminProfit: Number(periodAgg._sum.platform_fee_amount || 0),
        lecturerNet: Number(periodAgg._sum.lecturer_net_amount || 0),
        paidOrdersCount: periodAgg._count._all,
      },
      allTime: {
        grossRevenue: Number(allTimeAgg._sum.gross_amount || 0),
        adminProfit: Number(allTimeAgg._sum.platform_fee_amount || 0),
        lecturerNet: Number(allTimeAgg._sum.lecturer_net_amount || 0),
        paidOrdersCount: allTimeAgg._count._all,
      },
      pendingPayouts: {
        count: pendingPayoutAgg._count._all,
        totalAmount: Number(pendingPayoutAgg._sum.amount || 0),
      },
      dailyTrend,
    };
  }

  async getAdminOrders(query: AdminOrdersQueryInput) {
    const searchNumeric =
      query.search && /^\d+$/.test(query.search)
        ? BigInt(query.search)
        : undefined;

    const where: Prisma.ordersWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.courseId && { course_id: query.courseId }),
      ...(query.lecturerId && { lecturer_id: query.lecturerId }),
      ...((query.fromTime || query.toTime) && {
        created_at: {
          ...(query.fromTime && { gte: query.fromTime }),
          ...(query.toTime && { lte: query.toTime }),
        },
      }),
      ...(query.search && {
        OR: [
          ...(searchNumeric !== undefined
            ? [{ order_code: searchNumeric }]
            : []),
          {
            buyer: {
              OR: [
                { full_name: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
              ],
            },
          },
          {
            courses: {
              title: { contains: query.search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: query.limit,
        include: {
          courses: {
            select: { id: true, title: true, slug: true },
          },
          buyer: {
            select: { id: true, full_name: true, email: true },
          },
          lecturer: {
            select: { id: true, full_name: true, email: true },
          },
        },
      }),
      prisma.orders.count({ where }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        orderCode: Number(o.order_code),
        status: o.status,
        provider: o.provider,
        grossAmount: Number(o.gross_amount),
        platformFeeRate: Number(o.platform_fee_rate),
        platformFeeAmount: Number(o.platform_fee_amount),
        lecturerNetAmount: Number(o.lecturer_net_amount),
        commissionSource: o.commission_source,
        payosReference: o.payos_reference,
        course: o.courses,
        buyer: {
          id: o.buyer.id,
          fullName: o.buyer.full_name,
          email: o.buyer.email,
        },
        lecturer: {
          id: o.lecturer.id,
          fullName: o.lecturer.full_name,
          email: o.lecturer.email,
        },
        paidAt: o.paid_at,
        expiredAt: o.expired_at,
        createdAt: o.created_at,
      })),
      pagination: this.buildPagination(query.page, query.limit, total),
    };
  }

  async getAdminSettings() {
    const [settings, lecturers, courses] = await Promise.all([
      getPlatformSettings(),
      prisma.users.findMany({
        where: { role: { in: [user_role.lecturer, user_role.admin] } },
        orderBy: { full_name: "asc" },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          teacher_profile: {
            select: { platform_fee_rate: true },
          },
        },
      }),
      prisma.courses.findMany({
        where: {
          price: { gt: 0 },
        },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          status: true,
          platform_fee_rate: true,
          users: {
            select: { id: true, full_name: true },
          },
        },
      }),
    ]);

    return {
      settings,
      lecturers: lecturers.map((l) => ({
        id: l.id,
        fullName: l.full_name,
        email: l.email,
        role: l.role,
        platformFeeRate:
          l.teacher_profile?.platform_fee_rate !== null &&
          l.teacher_profile?.platform_fee_rate !== undefined
            ? Number(l.teacher_profile.platform_fee_rate)
            : null,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        price: Number(c.price || 0),
        status: c.status,
        platformFeeRate:
          c.platform_fee_rate !== null && c.platform_fee_rate !== undefined
            ? Number(c.platform_fee_rate)
            : null,
        lecturer: {
          id: c.users.id,
          fullName: c.users.full_name,
        },
      })),
    };
  }

  async updateAdminSettings(
    adminId: string,
    input: UpdatePlatformSettingsInput,
  ) {
    const now = new Date();
    const updates: Array<{
      key: string;
      value: string;
      description: string;
    }> = [];

    if (input.defaultPlatformFeeRate !== undefined) {
      updates.push({
        key: "default_platform_fee_rate",
        value: String(input.defaultPlatformFeeRate),
        description:
          "Tỉ lệ hoa hồng mặc định của nền tảng/Admin (%) trên mỗi đơn hàng khóa học (0 - 100).",
      });
    }

    if (input.minPayoutAmount !== undefined) {
      updates.push({
        key: "min_payout_amount",
        value: String(Math.round(input.minPayoutAmount)),
        description:
          "Số tiền tối thiểu (VND) giảng viên có thể tạo yêu cầu rút tiền từ ví.",
      });
    }

    if (input.orderExpiryMinutes !== undefined) {
      updates.push({
        key: "order_expiry_minutes",
        value: String(input.orderExpiryMinutes),
        description:
          "Thời gian hiệu lực (phút) của một đơn hàng / mã VietQR PayOS trước khi tự động hết hạn.",
      });
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.platform_settings.upsert({
          where: { key: u.key },
          create: {
            key: u.key,
            value: u.value,
            description: u.description,
            updated_by: adminId,
            updated_at: now,
          },
          update: {
            value: u.value,
            updated_by: adminId,
            updated_at: now,
          },
        }),
      ),
    );

    return getPlatformSettings();
  }

  async updateLecturerCommission(
    lecturerId: string,
    platformFeeRate: number | null,
  ) {
    const user = await prisma.users.findUnique({
      where: { id: lecturerId },
      select: { id: true, full_name: true, role: true },
    });

    if (!user) {
      throw new NotFoundError("Lecturer not found");
    }

    if (
      user.role !== user_role.lecturer &&
      user.role !== user_role.admin
    ) {
      throw new BadRequestError("User is not a lecturer");
    }

    const decimalRate =
      platformFeeRate === null ? null : new Prisma.Decimal(platformFeeRate);

    await prisma.teacher_profile.upsert({
      where: { user_id: lecturerId },
      create: {
        user_id: lecturerId,
        platform_fee_rate: decimalRate,
      },
      update: {
        platform_fee_rate: decimalRate,
        updated_at: new Date(),
      },
    });

    return {
      lecturerId: user.id,
      fullName: user.full_name,
      platformFeeRate,
    };
  }

  async updateCourseCommission(
    courseId: string,
    platformFeeRate: number | null,
  ) {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: {
        platform_fee_rate:
          platformFeeRate === null
            ? null
            : new Prisma.Decimal(platformFeeRate),
        updated_at: new Date(),
      },
      select: { id: true, title: true, platform_fee_rate: true },
    });

    return {
      courseId: updated.id,
      title: updated.title,
      platformFeeRate:
        updated.platform_fee_rate !== null
          ? Number(updated.platform_fee_rate)
          : null,
    };
  }

  async getAdminPayouts(query: AdminPayoutsQueryInput) {
    const where: Prisma.payout_requestsWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.lecturerId && { lecturer_id: query.lecturerId }),
    };

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.payout_requests.findMany({
        where,
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
        skip,
        take: query.limit,
        include: {
          lecturer: {
            select: { id: true, full_name: true, email: true },
          },
          reviewer: {
            select: { id: true, full_name: true },
          },
        },
      }),
      prisma.payout_requests.count({ where }),
    ]);

    return {
      items: rows.map((p) => this.serializePayout(p)),
      pagination: this.buildPagination(query.page, query.limit, total),
    };
  }

  async completePayoutRequest(
    adminId: string,
    payoutId: string,
    input: CompletePayoutInput,
  ) {
    const completedPayout = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.payout_requests.updateMany({
        where: {
          id: payoutId,
          status: payout_status.pending,
        },
        data: {
          status: payout_status.completed,
          transaction_reference: input.transactionReference,
          proof_image_url: input.proofImageUrl || null,
          admin_note: input.adminNote || null,
          reviewed_by: adminId,
          reviewed_at: now,
          completed_at: now,
          updated_at: now,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(
          "Yêu cầu rút tiền không tồn tại hoặc đã được xử lý trước đó.",
        );
      }

      const payout = await tx.payout_requests.findUniqueOrThrow({
        where: { id: payoutId },
        include: {
          lecturer: {
            select: { id: true, full_name: true, email: true },
          },
          reviewer: {
            select: { id: true, full_name: true },
          },
        },
      });

      const wallet = await tx.lecturer_wallets.findUniqueOrThrow({
        where: { id: payout.wallet_id },
      });

      const amount = Number(payout.amount);
      const pendingAfter = Math.max(
        0,
        Number(wallet.pending_payout_balance) - amount,
      );
      const withdrawnAfter = Number(wallet.withdrawn_balance) + amount;
      const available = Number(wallet.available_balance);

      await tx.lecturer_wallets.update({
        where: { id: wallet.id },
        data: {
          pending_payout_balance: new Prisma.Decimal(pendingAfter),
          withdrawn_balance: new Prisma.Decimal(withdrawnAfter),
          updated_at: now,
        },
      });

      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          lecturer_id: payout.lecturer_id,
          type: wallet_tx_type.payout_completed,
          amount: new Prisma.Decimal(0),
          balance_before: new Prisma.Decimal(available),
          balance_after: new Prisma.Decimal(available),
          payout_request_id: payout.id,
          description: `Hoàn tất chi trả ${amount.toLocaleString("vi-VN")} ₫ (Mã GD: ${input.transactionReference})`,
        },
      });

      return payout;
    });

    return this.serializePayout(completedPayout);
  }

  async rejectPayoutRequest(
    adminId: string,
    payoutId: string,
    input: RejectPayoutInput,
  ) {
    const rejectedPayout = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.payout_requests.updateMany({
        where: {
          id: payoutId,
          status: payout_status.pending,
        },
        data: {
          status: payout_status.rejected,
          admin_note: input.adminNote,
          reviewed_by: adminId,
          reviewed_at: now,
          updated_at: now,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(
          "Yêu cầu rút tiền không tồn tại hoặc đã được xử lý trước đó.",
        );
      }

      const payout = await tx.payout_requests.findUniqueOrThrow({
        where: { id: payoutId },
        include: {
          lecturer: {
            select: { id: true, full_name: true, email: true },
          },
          reviewer: {
            select: { id: true, full_name: true },
          },
        },
      });

      const wallet = await tx.lecturer_wallets.findUniqueOrThrow({
        where: { id: payout.wallet_id },
      });

      const amount = Number(payout.amount);
      const balanceBefore = Number(wallet.available_balance);
      const balanceAfter = balanceBefore + amount;
      const pendingAfter = Math.max(
        0,
        Number(wallet.pending_payout_balance) - amount,
      );

      await tx.lecturer_wallets.update({
        where: { id: wallet.id },
        data: {
          available_balance: new Prisma.Decimal(balanceAfter),
          pending_payout_balance: new Prisma.Decimal(pendingAfter),
          updated_at: now,
        },
      });

      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          lecturer_id: payout.lecturer_id,
          type: wallet_tx_type.payout_refund,
          amount: new Prisma.Decimal(amount),
          balance_before: new Prisma.Decimal(balanceBefore),
          balance_after: new Prisma.Decimal(balanceAfter),
          payout_request_id: payout.id,
          description: `Hoàn lại ${amount.toLocaleString("vi-VN")} ₫ do từ chối rút tiền: ${input.adminNote}`,
        },
      });

      return payout;
    });

    return this.serializePayout(rejectedPayout);
  }
}

export const revenueService = new RevenueService();
