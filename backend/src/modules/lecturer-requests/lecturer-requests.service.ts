import prisma from "../../prisma";
import { lecturer_request_status, user_role, Prisma } from "@prisma/client";
import {
  QueryLecturerRequestsInput,
  ReviewLecturerRequestInput,
} from "./lecturer-requests.schema";
import { NotFoundError, BadRequestError } from "../../common/errors/app-error";

export class LecturerRequestsService {
  /**
   * 1. Lấy danh sách các đơn đăng ký giảng viên (Phân trang, lọc, tìm kiếm)
   */
  async getRequestsList(query: QueryLecturerRequestsInput) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc where
    const whereCondition: Prisma.lecturer_requestsWhereInput = {};

    // Lọc theo trạng thái
    if (status && status !== "all") {
      whereCondition.status = status as lecturer_request_status;
    }

    // Tìm kiếm theo tên hoặc email của ứng viên
    if (search && search.trim().length > 0) {
      const keyword = search.trim();
      whereCondition.users_lecturer_requests_user_idTousers = {
        OR: [
          { full_name: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
        ],
      };
    }

    // Đếm tổng số bản ghi và truy vấn dữ liệu song song
    const [total, rawRequests] = await Promise.all([
      prisma.lecturer_requests.count({ where: whereCondition }),
      prisma.lecturer_requests.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          users_lecturer_requests_user_idTousers: {
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
              role: true,
              is_active: true,
              created_at: true,
              teacher_profile: {
                select: {
                  degree: true,
                  expertise: true,
                  bio: true,
                  certificates: true,
                  cv_url: true,
                },
              },
            },
          },
          users_lecturer_requests_reviewed_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Chuẩn hóa định dạng dữ liệu trả về cho Frontend
    const items = rawRequests.map((req) => {
      const candidateUser = req.users_lecturer_requests_user_idTousers;
      const reviewerUser = req.users_lecturer_requests_reviewed_byTousers;

      return {
        id: req.id,
        user_id: req.user_id,
        status: req.status,
        note: req.note,
        reviewed_at: req.reviewed_at,
        created_at: req.created_at,
        updated_at: req.updated_at,
        candidate: {
          id: candidateUser.id,
          email: candidateUser.email,
          full_name: candidateUser.full_name,
          avatar_url: candidateUser.avatar_url,
          role: candidateUser.role,
          is_active: candidateUser.is_active,
          created_at: candidateUser.created_at,
          degree: candidateUser.teacher_profile?.degree || null,
          expertise: candidateUser.teacher_profile?.expertise || null,
          bio: candidateUser.teacher_profile?.bio || null,
          certificates: candidateUser.teacher_profile?.certificates || null,
          cv_url: candidateUser.teacher_profile?.cv_url || null,
        },
        reviewer: reviewerUser
          ? {
              id: reviewerUser.id,
              full_name: reviewerUser.full_name,
              email: reviewerUser.email,
            }
          : null,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 2. Lấy số lượng thống kê theo trạng thái đơn (Phục vụ hiển thị Badge số lượng cần duyệt)
   */
  async getRequestStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.lecturer_requests.count({
        where: { status: lecturer_request_status.pending },
      }),
      prisma.lecturer_requests.count({
        where: { status: lecturer_request_status.approved },
      }),
      prisma.lecturer_requests.count({
        where: { status: lecturer_request_status.rejected },
      }),
      prisma.lecturer_requests.count(),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
    };
  }

  /**
   * 3. Phê duyệt (Approve) hoặc Từ chối (Reject) đơn đăng ký giảng viên
   */
  async reviewRequest(
    requestId: string,
    adminId: string,
    data: ReviewLecturerRequestInput,
  ) {
    // 3.1 Kiểm tra đơn có tồn tại không
    const existingRequest = await prisma.lecturer_requests.findUnique({
      where: { id: requestId },
      include: {
        users_lecturer_requests_user_idTousers: {
          select: { id: true, role: true },
        },
      },
    });

    if (!existingRequest) {
      throw new NotFoundError("Lecturer application request not found");
    }

    const candidateId = existingRequest.user_id;

    // 3.2 Thực thi cập nhật đồng bộ trong Transaction nguyên tử
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái đơn duyệt
      const updated = await tx.lecturer_requests.update({
        where: { id: requestId },
        data: {
          status: data.status,
          reviewed_by: adminId,
          reviewed_at: new Date(),
          note:
            data.note !== undefined && data.note !== null
              ? data.note
              : data.status === lecturer_request_status.approved
                ? "Approved by Administrator"
                : "Rejected by Administrator",
        },
        include: {
          users_lecturer_requests_user_idTousers: {
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
              role: true,
              teacher_profile: true,
            },
          },
          users_lecturer_requests_reviewed_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      // Nếu duyệt thành công: NÂNG CẤP role người dùng lên LECTURER
      if (data.status === lecturer_request_status.approved) {
        await tx.users.update({
          where: { id: candidateId },
          data: { role: user_role.lecturer },
        });
      }

      // Nếu từ chối: Đảm bảo role vẫn là STUDENT
      if (data.status === lecturer_request_status.rejected) {
        await tx.users.update({
          where: { id: candidateId },
          data: { role: user_role.student },
        });
      }

      return updated;
    });

    return {
      id: result.id,
      user_id: result.user_id,
      status: result.status,
      note: result.note,
      reviewed_at: result.reviewed_at,
      candidate: {
        id: result.users_lecturer_requests_user_idTousers.id,
        email: result.users_lecturer_requests_user_idTousers.email,
        full_name: result.users_lecturer_requests_user_idTousers.full_name,
        role:
          data.status === lecturer_request_status.approved
            ? user_role.lecturer
            : user_role.student,
      },
      reviewer: result.users_lecturer_requests_reviewed_byTousers
        ? {
            id: result.users_lecturer_requests_reviewed_byTousers.id,
            full_name:
              result.users_lecturer_requests_reviewed_byTousers.full_name,
            email: result.users_lecturer_requests_reviewed_byTousers.email,
          }
        : null,
    };
  }
}

export const lecturerRequestsService = new LecturerRequestsService();
