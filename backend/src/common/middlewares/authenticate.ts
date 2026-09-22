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
