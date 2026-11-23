import {
  Prisma,
  enrollment_status,
  order_status,
  user_role,
  wallet_tx_type,
} from "@prisma/client";
import type { Webhook } from "@payos/node/lib/resources/webhooks/webhook";
import prisma from "../../prisma";
import { envConfig } from "../../config/env.config";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/app-error";
import { PaginationMeta } from "../../common/utils/api-response";
import {
  calculateRevenueSplit,
  getPlatformSettings,
  resolveCourseCommission,
} from "../revenue/commission.helper";
import { payosGateway } from "./payos.gateway";
import { MyOrdersQueryInput } from "./payments.schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PaymentsService {
  /**
   * Tạo mã đơn hàng số nguyên dương duy nhất cho PayOS (tối đa 13 chữ số, an toàn với JS Number & PostgreSQL BigInt).
   */
  private async generateUniqueOrderCode(): Promise<number> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const tsPart = Date.now().toString().slice(-10);
      const randPart = Math.floor(100 + Math.random() * 900).toString();
      const candidate = Number(`${tsPart}${randPart}`);

      const exists = await prisma.orders.findUnique({
        where: { order_code: BigInt(candidate) },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }
    throw new Error("Unable to generate unique order code");
  }

  /**
   * Tìm ID bài học đầu tiên của khóa học để điều hướng học viên vào học ngay sau khi thanh toán.
   */
  private async getFirstLessonId(courseId: string): Promise<string | null> {
    const firstChapter = await prisma.chapters.findFirst({
      where: { course_id: courseId },
      orderBy: { order_index: "asc" },
      select: {
        lessons: {
          orderBy: { order_index: "asc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    return firstChapter?.lessons[0]?.id ?? null;
  }

  /**
   * Chuẩn hóa dữ liệu đơn hàng trả về Client (chuyển BigInt & Decimal sang kiểu JSON-safe).
   */
  private serializeOrder(order: any) {
    return {
      id: order.id,
      orderCode: Number(order.order_code),
      userId: order.user_id,
      courseId: order.course_id,
      lecturerId: order.lecturer_id,
      provider: order.provider,
      grossAmount: Number(order.gross_amount),
      platformFeeRate: Number(order.platform_fee_rate),
      platformFeeAmount: Number(order.platform_fee_amount),
      lecturerNetAmount: Number(order.lecturer_net_amount),
      commissionSource: order.commission_source,
      status: order.status,
      payos: {
        paymentLinkId: order.payos_payment_link_id,
        checkoutUrl: order.payos_checkout_url,
        qrCode: order.payos_qr_code,
        bin: order.payos_bin,
        accountNumber: order.payos_account_number,
        accountName: order.payos_account_name,
        description: order.payos_description,
        reference: order.payos_reference,
        transactionDateTime: order.payos_transaction_datetime,
      },
      expiredAt: order.expired_at,
      paidAt: order.paid_at,
      cancelledAt: order.cancelled_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      ...(order.courses && {
        course: {
          id: order.courses.id,
          title: order.courses.title,
          slug: order.courses.slug,
          thumbnailUrl: order.courses.thumbnail_url,
          price: Number(order.courses.price || 0),
          level: order.courses.level,
          instructor: order.courses.users
            ? {
                id: order.courses.users.id,
                fullName: order.courses.users.full_name,
                avatarUrl: order.courses.users.avatar_url,
              }
            : undefined,
        },
      }),
      ...(order.buyer && {
        buyer: {
          id: order.buyer.id,
          fullName: order.buyer.full_name,
          email: order.buyer.email,
        },
      }),
    };
  }

  /**
   * 1. Tạo đơn hàng thanh toán PayOS (hoặc tái sử dụng đơn pending còn hạn).
   */
  async createOrder(userId: string, courseIdOrSlug: string) {
    const isUuid = UUID_REGEX.test(courseIdOrSlug);

    const [course, buyer, settings] = await Promise.all([
      prisma.courses.findFirst({
        where: isUuid
          ? { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] }
          : { slug: courseIdOrSlug },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail_url: true,
          price: true,
          level: true,
          status: true,
          platform_fee_rate: true,
          lecturer_id: true,
          users: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
              role: true,
              teacher_profile: {
                select: {
                  platform_fee_rate: true,
                },
              },
            },
          },
        },
      }),
      prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, full_name: true, email: true },
      }),
      getPlatformSettings(),
    ]);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (course.status !== "published") {
      throw new BadRequestError("This course is not open for enrollment");
    }

    if (course.lecturer_id === userId) {
      throw new BadRequestError("You cannot purchase your own course");
    }

    const grossAmount = Math.round(Number(course.price || 0));
    if (grossAmount <= 0) {
      throw new BadRequestError(
        "This course is free. Please use direct enrollment instead.",
      );
    }

    if (grossAmount < 2000) {
      throw new BadRequestError(
        "PayOS requires a minimum payment amount of 2,000 VND.",
      );
    }

    const existingEnrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: course.id,
        },
      },
    });

    if (
      existingEnrollment &&
      existingEnrollment.status !== enrollment_status.cancelled
    ) {
      throw new BadRequestError("You are already enrolled in this course");
    }

    const now = new Date();

    // Đánh dấu hết hạn các đơn pending đã quá thời hạn
    await prisma.orders.updateMany({
      where: {
        user_id: userId,
        course_id: course.id,
        status: order_status.pending,
        expired_at: { lte: now },
      },
      data: {
        status: order_status.expired,
        updated_at: now,
      },
    });

    // Tái sử dụng đơn pending còn hạn và cùng mức giá
    const reusableOrder = await prisma.orders.findFirst({
      where: {
        user_id: userId,
        course_id: course.id,
        status: order_status.pending,
        expired_at: { gt: now },
        gross_amount: new Prisma.Decimal(grossAmount),
        payos_qr_code: { not: null },
      },
      orderBy: { created_at: "desc" },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            price: true,
            level: true,
            users: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
      },
    });

    if (reusableOrder) {
      return this.serializeOrder(reusableOrder);
    }

    // Tính toán tỉ lệ ăn chia 3 tầng & snapshot số tiền
    const commission = await resolveCourseCommission({
      coursePlatformFeeRate: course.platform_fee_rate,
      lecturerPlatformFeeRate: course.users.teacher_profile?.platform_fee_rate,
      lecturerRole: course.users.role,
      defaultPlatformFeeRate: settings.defaultPlatformFeeRate,
    });

    const split = calculateRevenueSplit(
      grossAmount,
      commission.platformFeeRate,
      commission.commissionSource,
    );

    const orderCode = await this.generateUniqueOrderCode();
    const expiredAt = new Date(
      now.getTime() + settings.orderExpiryMinutes * 60 * 1000,
    );
    const expiredAtUnix = Math.floor(expiredAt.getTime() / 1000);
    const frontendUrl = envConfig.FRONTEND_URL.replace(/\/+$/, "");
    const payosDescription = `KH ${orderCode}`.slice(0, 25);

    const payosRes = await payosGateway.createPaymentLink({
      orderCode,
      amount: split.grossAmount,
      description: payosDescription,
      returnUrl: `${frontendUrl}/checkout/${orderCode}?payment=success`,
      cancelUrl: `${frontendUrl}/checkout/${orderCode}?payment=cancelled`,
      expiredAt: expiredAtUnix,
      buyerName: buyer?.full_name,
      buyerEmail: buyer?.email,
      items: [
        {
          name: course.title.slice(0, 100),
          quantity: 1,
          price: split.grossAmount,
        },
      ],
    });

    const createdOrder = await prisma.orders.create({
      data: {
        order_code: BigInt(orderCode),
        user_id: userId,
        course_id: course.id,
        lecturer_id: course.lecturer_id,
        gross_amount: new Prisma.Decimal(split.grossAmount),
        platform_fee_rate: new Prisma.Decimal(split.platformFeeRate),
        platform_fee_amount: new Prisma.Decimal(split.platformFeeAmount),
        lecturer_net_amount: new Prisma.Decimal(split.lecturerNetAmount),
        commission_source: split.commissionSource,
        status: order_status.pending,
        payos_payment_link_id: payosRes.paymentLinkId,
        payos_checkout_url: payosRes.checkoutUrl,
        payos_qr_code: payosRes.qrCode,
        payos_bin: payosRes.bin,
        payos_account_number: payosRes.accountNumber,
        payos_account_name: payosRes.accountName,
        payos_description: payosRes.description || payosDescription,
        expired_at: expiredAt,
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            price: true,
            level: true,
            users: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
      },
    });

    return this.serializeOrder(createdOrder);
  }

  /**
   * 2. Lấy lịch sử đơn hàng của học viên đang đăng nhập.
   */
  async getMyOrders(userId: string, query: MyOrdersQueryInput) {
    const where: Prisma.ordersWhereInput = {
      user_id: userId,
      ...(query.status && { status: query.status }),
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
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail_url: true,
              price: true,
              level: true,
              users: {
                select: { id: true, full_name: true, avatar_url: true },
              },
            },
          },
        },
      }),
      prisma.orders.count({ where }),
    ]);

    const pagination: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    };

    return {
      items: orders.map((order) => this.serializeOrder(order)),
      pagination,
    };
  }

  /**
   * 3. Lấy chi tiết một đơn hàng theo orderCode (chỉ chủ đơn hoặc Admin).
   */
  async getOrderDetail(userId: string, userRole: user_role, orderCode: number) {
    let order = await prisma.orders.findUnique({
      where: { order_code: BigInt(orderCode) },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            price: true,
            level: true,
            users: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
        buyer: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user_id !== userId && userRole !== user_role.admin) {
      throw new ForbiddenError("You do not have permission to view this order");
    }

    if (
      order.status === order_status.pending &&
      order.expired_at <= new Date()
    ) {
      order = await prisma.orders.update({
        where: { id: order.id },
        data: { status: order_status.expired, updated_at: new Date() },
        include: {
          courses: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail_url: true,
              price: true,
              level: true,
              users: {
                select: { id: true, full_name: true, avatar_url: true },
              },
            },
          },
          buyer: {
            select: { id: true, full_name: true, email: true },
          },
        },
      });
    }

    const firstLessonId =
      order.status === order_status.paid
        ? await this.getFirstLessonId(order.course_id)
        : null;

    return {
      ...this.serializeOrder(order),
      firstLessonId,
    };
  }

  /**
   * 4. Polling trạng thái nhẹ cho CheckoutPage.
   */
  async getOrderStatus(userId: string, userRole: user_role, orderCode: number) {
    const order = await prisma.orders.findUnique({
      where: { order_code: BigInt(orderCode) },
      select: {
        id: true,
        order_code: true,
        user_id: true,
        course_id: true,
        status: true,
        paid_at: true,
        expired_at: true,
        courses: {
          select: { slug: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user_id !== userId && userRole !== user_role.admin) {
      throw new ForbiddenError("You do not have permission to view this order");
    }

    let currentStatus = order.status;
    if (
      currentStatus === order_status.pending &&
      order.expired_at <= new Date()
    ) {
      await prisma.orders.update({
        where: { id: order.id },
        data: { status: order_status.expired, updated_at: new Date() },
      });
      currentStatus = order_status.expired;
    }

    const firstLessonId =
      currentStatus === order_status.paid
        ? await this.getFirstLessonId(order.course_id)
        : null;

    return {
      orderCode: Number(order.order_code),
      status: currentStatus,
      paidAt: order.paid_at,
      expiredAt: order.expired_at,
      courseSlug: order.courses.slug,
      firstLessonId,
    };
  }

  /**
   * 5. Đối soát chủ động với PayOS (phòng trường hợp Webhook đến trễ hoặc test local chưa mở ngrok).
   */
  async syncOrderWithPayOS(
    userId: string,
    userRole: user_role,
    orderCode: number,
  ) {
    const order = await prisma.orders.findUnique({
      where: { order_code: BigInt(orderCode) },
      select: {
        id: true,
        user_id: true,
        status: true,
        gross_amount: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user_id !== userId && userRole !== user_role.admin) {
      throw new ForbiddenError("You do not have permission to sync this order");
    }

    if (order.status === order_status.paid) {
      return this.getOrderDetail(userId, userRole, orderCode);
    }

    const paymentLinkInfo = await payosGateway.getPaymentLinkInfo(orderCode);

    if (
      paymentLinkInfo.status === "PAID" &&
      Number(paymentLinkInfo.amountPaid || 0) >= Number(order.gross_amount)
    ) {
      const latestTx =
        paymentLinkInfo.transactions?.[
          paymentLinkInfo.transactions.length - 1
        ];
      await this.completePaidOrder(orderCode, {
        reference: latestTx?.reference ?? null,
        transactionDateTime: latestTx?.transactionDateTime ?? null,
        rawPayload: paymentLinkInfo as unknown as Prisma.InputJsonValue,
      });
    } else if (
      paymentLinkInfo.status === "CANCELLED" &&
      order.status === order_status.pending
    ) {
      await prisma.orders.update({
        where: { id: order.id },
        data: {
          status: order_status.cancelled,
          cancelled_at: new Date(),
          updated_at: new Date(),
        },
      });
    } else if (
      paymentLinkInfo.status === "EXPIRED" &&
      order.status === order_status.pending
    ) {
      await prisma.orders.update({
        where: { id: order.id },
        data: {
          status: order_status.expired,
          updated_at: new Date(),
        },
      });
    }

    return this.getOrderDetail(userId, userRole, orderCode);
  }

  /**
   * 6. Học viên hoặc Admin hủy đơn hàng đang pending.
   */
  async cancelOrder(userId: string, userRole: user_role, orderCode: number) {
    const order = await prisma.orders.findUnique({
      where: { order_code: BigInt(orderCode) },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user_id !== userId && userRole !== user_role.admin) {
      throw new ForbiddenError(
        "You do not have permission to cancel this order",
      );
    }

    if (order.status === order_status.paid) {
      throw new BadRequestError("Cannot cancel a paid order");
    }

    if (order.status === order_status.cancelled) {
      return this.getOrderDetail(userId, userRole, orderCode);
    }

    try {
      await payosGateway.cancelPaymentLink(orderCode, "Cancelled by user");
    } catch (error) {
      // Nếu link đã hết hạn hoặc đã hủy trên PayOS thì vẫn cho cập nhật trạng thái nội bộ
      console.warn(
        `[PayOS] cancelPaymentLink warning for order ${orderCode}:`,
        error,
      );
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: {
        status: order_status.cancelled,
        cancelled_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.getOrderDetail(userId, userRole, orderCode);
  }

  /**
   * 7. Xử lý Webhook callback từ PayOS (Public endpoint - xác thực chữ ký HMAC-SHA256).
   */
  async handlePayOSWebhook(payload: Webhook) {
    const verifiedData = await payosGateway.verifyWebhook(payload);

    // PayOS gửi orderCode = 123 để kiểm tra URL khi cấu hình Webhook trên Dashboard
    if (Number(verifiedData.orderCode) === 123) {
      return {
        ignored: true,
        reason: "PayOS webhook verification ping",
      };
    }

    if (!payload.success || verifiedData.code !== "00") {
      return {
        ignored: true,
        reason: `Webhook status not paid (code=${verifiedData.code})`,
      };
    }

    const order = await prisma.orders.findUnique({
      where: { order_code: BigInt(verifiedData.orderCode) },
      select: { id: true, gross_amount: true },
    });

    if (!order) {
      console.warn(
        `[PayOS Webhook] Order not found for orderCode=${verifiedData.orderCode}`,
      );
      return {
        ignored: true,
        reason: "Order not found in system",
      };
    }

    if (Number(verifiedData.amount) < Number(order.gross_amount)) {
      console.warn(
        `[PayOS Webhook] Underpaid orderCode=${verifiedData.orderCode}: received=${verifiedData.amount}, expected=${order.gross_amount}`,
      );
      return {
        ignored: true,
        reason: "Amount received is less than order gross amount",
      };
    }

    const processed = await this.completePaidOrder(verifiedData.orderCode, {
      reference: verifiedData.reference ?? null,
      transactionDateTime: verifiedData.transactionDateTime ?? null,
      rawPayload: payload as unknown as Prisma.InputJsonValue,
    });

    return {
      processed,
      orderCode: Number(verifiedData.orderCode),
    };
  }

  /**
   * 8. Hàm cốt lõi hoàn tất đơn hàng (Idempotent & Atomic Transaction):
   *    - Cập nhật đơn -> paid (chỉ 1 request thắng nếu webhook & sync chạy đồng thời)
   *    - Kích hoạt enrollment cho học viên
   *    - Cộng tiền thực nhận vào ví giảng viên & ghi sổ cái wallet_transactions
   */
  async completePaidOrder(
    orderCode: number,
    paymentMeta: {
      reference?: string | null;
      transactionDateTime?: string | null;
      rawPayload?: Prisma.InputJsonValue;
    },
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.orders.updateMany({
        where: {
          order_code: BigInt(orderCode),
          status: { in: [order_status.pending, order_status.expired] },
        },
        data: {
          status: order_status.paid,
          paid_at: now,
          payos_reference: paymentMeta.reference ?? undefined,
          payos_transaction_datetime:
            paymentMeta.transactionDateTime ?? undefined,
          ...(paymentMeta.rawPayload !== undefined && {
            webhook_payload: paymentMeta.rawPayload,
          }),
          updated_at: now,
        },
      });

      // Nếu count === 0 nghĩa là đơn đã được xử lý trước đó -> thoát an toàn (Idempotent)
      if (updated.count === 0) {
        return false;
      }

      const order = await tx.orders.findUnique({
        where: { order_code: BigInt(orderCode) },
        include: {
          courses: {
            select: { title: true },
          },
        },
      });

      if (!order) {
        return false;
      }

      // Tự động ghi danh khóa học cho học viên
      await tx.enrollments.upsert({
        where: {
          user_id_course_id: {
            user_id: order.user_id,
            course_id: order.course_id,
          },
        },
        create: {
          user_id: order.user_id,
          course_id: order.course_id,
          status: enrollment_status.active,
          enrolled_at: now,
        },
        update: {
          status: enrollment_status.active,
          enrolled_at: now,
        },
      });

      // Ghi nhận doanh thu vào ví giảng viên & sổ cái nếu lecturer_net_amount > 0
      const grossAmount = Number(order.gross_amount);
      const platformFeeAmount = Number(order.platform_fee_amount);
      const lecturerNetAmount = Number(order.lecturer_net_amount);

      if (lecturerNetAmount > 0) {
        let wallet = await tx.lecturer_wallets.findUnique({
          where: { lecturer_id: order.lecturer_id },
        });

        if (!wallet) {
          wallet = await tx.lecturer_wallets.create({
            data: {
              lecturer_id: order.lecturer_id,
            },
          });
        }

        const balanceBefore = Number(wallet.available_balance);
        const balanceAfter = balanceBefore + lecturerNetAmount;

        await tx.lecturer_wallets.update({
          where: { id: wallet.id },
          data: {
            total_gross_revenue: new Prisma.Decimal(
              Number(wallet.total_gross_revenue) + grossAmount,
            ),
            total_platform_fee: new Prisma.Decimal(
              Number(wallet.total_platform_fee) + platformFeeAmount,
            ),
            total_net_earned: new Prisma.Decimal(
              Number(wallet.total_net_earned) + lecturerNetAmount,
            ),
            available_balance: new Prisma.Decimal(balanceAfter),
            updated_at: now,
          },
        });

        await tx.wallet_transactions.create({
          data: {
            wallet_id: wallet.id,
            lecturer_id: order.lecturer_id,
            type: wallet_tx_type.course_sale,
            amount: new Prisma.Decimal(lecturerNetAmount),
            balance_before: new Prisma.Decimal(balanceBefore),
            balance_after: new Prisma.Decimal(balanceAfter),
            order_id: order.id,
            description: `Course sale revenue for "${order.courses.title}" (Order #${orderCode})`,
          },
        });
      }

      return true;
    });
  }
}

export const paymentsService = new PaymentsService();
