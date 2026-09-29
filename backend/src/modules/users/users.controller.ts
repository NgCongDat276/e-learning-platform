import { Request, Response } from "express";
import { usersService } from "./users.service";
import { sendSuccess } from "../../common/utils/api-response";
import { HttpStatus } from "../../common/errors/http-status";

export class UsersController {
  // [GET] /users/profile - Lấy thông tin cá nhân
  async getProfile(req: Request, res: Response): Promise<Response> {
    const profile = await usersService.getProfile(req.user!.id);
    return sendSuccess(res, profile, "Profile fetched successfully");
  }

  // [PUT] /users/profile - Cập nhật thông tin cá nhân
  async updateProfile(req: Request, res: Response): Promise<Response> {
    const updatedUser = await usersService.updateProfile(req.user!.id, req.body);
    return sendSuccess(res, updatedUser, "Profile updated successfully");
  }

  // [PUT] /users/change-password - Đổi mật khẩu
  async changePassword(req: Request, res: Response): Promise<Response> {
    await usersService.changePassword(req.user!.id, req.body);
    return sendSuccess(res, null, "Password changed successfully");
  }

  // [GET] /users - Danh sách người dùng (Admin)
  async getUsersList(req: Request, res: Response): Promise<Response> {
    const result = await usersService.getUsersList(req.query as any);
    return sendSuccess(
      res,
      result.users,
      "Users list fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  // [PATCH] /users/:id/status - Đổi trạng thái khóa/mở tài khoản (Admin)
  async updateUserStatus(req: Request, res: Response): Promise<Response> {
    const targetUserId = req.params.id as string;
    const { is_active } = req.body;
    const updated = await usersService.updateUserStatus(
      targetUserId,
      is_active,
      req.user!.id,
    );
    return sendSuccess(
      res,
      updated,
      is_active ? "User activated successfully" : "User deactivated successfully",
    );
  }
}

export const usersController = new UsersController();
