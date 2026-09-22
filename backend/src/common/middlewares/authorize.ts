import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error";
import { user_role } from "@prisma/client";
/**
 * @param allowedRoles
 */

export const authorize = (...allowedRoles: user_role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError(
        "Vui lòng đăng nhập trước khi kiểm tra quyền",
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError("Bạn không có quyền thực hiện chức năng này");
    }

    next();
  };
};
