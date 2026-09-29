import prisma from "../../prisma";
import {
  NotFoundError,
  BadRequestError,
} from "../../common/errors/app-error";
import {
  hashPassword,
  comparePassword,
} from "../../common/utils/password.utils";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  QueryUsersInput,
} from "./users.schema";
import { Prisma, user_role } from "@prisma/client";

export class UsersService {
  /**
   * 1. Lấy thông tin hồ sơ chi tiết của người dùng
   */
  async getProfile(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        teacher_profile: {
          select: {
            degree: true,
            expertise: true,
            bio: true,
            certificates: true,
            cv_url: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  /**
   * 2. Cập nhật thông tin hồ sơ người dùng
   */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    const hasTeacherFields =
      data.degree !== undefined ||
      data.expertise !== undefined ||
      data.bio !== undefined ||
      data.certificates !== undefined ||
      data.cv_url !== undefined;

    const isLecturer = existingUser.role === user_role.lecturer || hasTeacherFields;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 2.1 Cập nhật bảng users
      const userUpdateData: Prisma.usersUpdateInput = {};
      if (data.full_name !== undefined) {
        userUpdateData.full_name = data.full_name;
      }
      if (data.avatar_url !== undefined) {
        userUpdateData.avatar_url = data.avatar_url ? data.avatar_url : null;
      }

      await tx.users.update({
        where: { id: userId },
        data: userUpdateData,
      });

      // 2.2 Nếu là giảng viên hoặc có gửi thông tin chuyên môn, upsert teacher_profile
      if (isLecturer && hasTeacherFields) {
        const teacherProfileData = {
          degree: data.degree !== undefined ? data.degree : undefined,
          expertise: data.expertise !== undefined ? data.expertise : undefined,
          bio: data.bio !== undefined ? data.bio : undefined,
          certificates:
            data.certificates !== undefined ? data.certificates : undefined,
          cv_url: data.cv_url !== undefined ? (data.cv_url ? data.cv_url : null) : undefined,
        };

        await tx.teacher_profile.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            degree: data.degree || null,
            expertise: data.expertise || null,
            bio: data.bio || null,
            certificates: data.certificates || null,
            cv_url: data.cv_url || null,
          },
          update: teacherProfileData,
        });
      }

      // 2.3 Trả về profile hoàn chỉnh sau khi cập nhật
      return tx.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          avatar_url: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
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
      });
    });

    return updatedUser;
  }

  /**
   * 3. Đổi mật khẩu tài khoản
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 3.1 Kiểm tra mật khẩu hiện tại
    const isPasswordCorrect = await comparePassword(
      data.current_password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      throw new BadRequestError("Current password is incorrect");
    }

    // 3.2 Băm mật khẩu mới
    const newHashedPassword = await hashPassword(data.new_password);

    // 3.3 Cập nhật vào cơ sở dữ liệu
    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newHashedPassword,
      },
    });

    return { success: true };
  }

  /**
   * 4. Lấy danh sách người dùng cho Admin (Phân trang, lọc theo vai trò, tìm kiếm)
   */
  async getUsersList(query: QueryUsersInput) {
    const { page, limit, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.usersWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
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
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 5. Khóa / Kích hoạt tài khoản người dùng (Admin)
   */
  async updateUserStatus(
    targetUserId: string,
    isActive: boolean,
    adminUserId: string,
  ) {
    if (targetUserId === adminUserId && !isActive) {
      throw new BadRequestError("You cannot deactivate your own account");
    }

    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, is_active: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: { is_active: isActive },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
      },
    });

    return updatedUser;
  }
}

export const usersService = new UsersService();
