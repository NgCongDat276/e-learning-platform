import prisma from "../../prisma";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../common/errors/app-error";
import {
  hashPassword,
  comparePassword,
} from "../../common/utils/password.utils";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.util";
import { RegisterInput, LoginInput } from "./auth.schema";
import { user_role } from "@prisma/client";

export class AuthService {
  /**
   * 1. Đăng ký tài khoản mới
   */
  async register(data: RegisterInput) {
    // 1.1 Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError(
        "Email này đã được sử dụng bởi một tài khoản khác",
      );
    }

    // 1.2 Băm mật khẩu bảo mật bằng bcryptjs
    const hashedPassword = await hashPassword(data.password);

    // 1.3 Lưu người dùng mới vào PostgreSQL qua Prisma Transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          email: data.email,
          password_hash: hashedPassword,
          full_name: data.full_name,
          role: data.role || user_role.student,
          is_active: true,
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          avatar_url: true,
          role: true,
          is_active: true,
          created_at: true,
        },
      });

      // Nếu là giảng viên, tạo thêm hồ sơ năng lực và yêu cầu phê duyệt
      if (data.role === user_role.lecturer) {
        await tx.teacher_profile.create({
          data: {
            user_id: createdUser.id,
            degree: data.degree || null,
            expertise: data.expertise || null,
            bio: data.bio || null,
            certificates: data.certificates || null,
            cv_url: data.cv_url || null,
          },
        });

        await tx.lecturer_requests.create({
          data: {
            user_id: createdUser.id,
            status: "pending",
            note: "Hồ sơ đăng ký giảng viên mới từ hệ thống",
          },
        });
      }

      return createdUser;
    });

    // 1.4 Tạo cặp token cho phiên đăng nhập đầu tiên
    const accessToken = generateAccessToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as user_role,
    });

    const refreshToken = generateRefreshToken({ id: newUser.id });

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 2. Đăng nhập tài khoản
   */
  async login(data: LoginInput) {
    // 2.1 Tìm user theo email
    const user = await prisma.users.findUnique({
      where: { email: data.email },
    });

    // Thông báo chung chung để tránh bị hacker dò email nào tồn tại hay chưa
    if (!user) {
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    // 2.2 Kiểm tra trạng thái tài khoản
    if (!user.is_active) {
      throw new UnauthorizedError(
        "Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên",
      );
    }

    // 2.3 So khớp mật khẩu
    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    // 2.4 Cấp phát cặp token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as user_role,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    // 2.5 Loại bỏ password_hash trước khi trả về
    const { password_hash, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 3. Cấp lại Access Token mới từ Refresh Token
   */
  async refreshToken(refreshTokenString: string) {
    // 3.1 Xác thực token (sẽ tự quăng UnauthorizedError nếu hết hạn hoặc sai mã)
    const payload = verifyRefreshToken(refreshTokenString);

    // 3.2 Kiểm tra xem user này còn tồn tại và hoạt động không
    const user = await prisma.users.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError("Tài khoản không tồn tại hoặc đã bị khóa");
    }

    // 3.3 Cấp Access Token mới
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as user_role,
    });

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * 4. Lấy thông tin người dùng hiện tại (Dùng cho API /me)
   */
  async getCurrentUser(userId: string) {
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

    if (!user) {
      throw new NotFoundError("Không tìm thấy thông tin người dùng");
    }

    return user;
  }
}

// Export một instance duy nhất (Singleton pattern) để Controller dùng chung
export const authService = new AuthService();
