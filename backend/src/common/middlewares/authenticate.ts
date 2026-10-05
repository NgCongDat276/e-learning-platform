import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/app-error";
import { verify } from "node:crypto";
import { verifyAccessToken } from "../utils/jwt.util";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Vui lòng đăng nhập để tiếp tục");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Mã xác thực không hợp lệ");
  }

  // giai mã token và gắn thông tin user và req.user
  const decodedUser = verifyAccessToken(token);
  req.user = decodedUser;

  next();
};

/**
 * Middleware xác thực tùy chọn: Nếu có token thì giải mã và gắn vào req.user,
 * nếu không có token hoặc token không hợp lệ thì bỏ qua (không throw lỗi 401).
 * Dùng cho các route công khai nhưng cho phép tác giả/admin xem trước nội dung nháp.
 */
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const decodedUser = verifyAccessToken(token);
        req.user = decodedUser;
      } catch {
        // Bỏ qua lỗi token, coi như khách vãng lai
      }
    }
  }

  next();
};
