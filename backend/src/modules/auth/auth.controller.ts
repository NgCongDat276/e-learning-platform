import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";

export class AuthController {
  //[POST] /auth/register - Đăng ký tài khoản

  async register(req: Request, res: Response): Promise<Response> {
    const result = await authService.register(req.body);
    return sendCreated(res, result, "Đăng ký tài khoản thành công");
  }

  //[POST] /auth/login - Đăng nhập

  async login(req: Request, res: Response): Promise<Response> {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Đăng nhập thành công");
  }

  //[POST] /auth/refresh-token - Cấp lại Access Token mới

  async refreshToken(req: Request, res: Response): Promise<Response> {
    const result = await authService.refreshToken(req.body.refreshToken);
    return sendSuccess(res, result, "Cấp lại access token thành công");
  }

  //[GET] /auth/me - Lấy thông tin tài khoản hiện tại

  async getMe(req: Request, res: Response): Promise<Response> {
    // req.user đã được middleware authenticate gắn vào
    const currentUser = await authService.getCurrentUser(req.user!.id);
    return sendSuccess(res, currentUser, "Lấy thông tin tài khoản thành công");
  }
}

export const authController = new AuthController();
