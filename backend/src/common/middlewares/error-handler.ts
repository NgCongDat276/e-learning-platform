import { Request, Response, NextFunction } from "express";
import { HttpStatus, HttpStatusCode } from "../errors/http-status";
import { AppError } from "../errors/app-error";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { sendError } from "../utils/api-response";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  let statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = "Đã có lỗi xảy ra từ máy chủ, vui lòng thử lại sau";
  let errorsDetails: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorsDetails = err.errorsDetails;
  } else if (err instanceof ZodError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Dữ liệu yêu cầu không hợp lệ";
    errorsDetails = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // P2002: Lỗi trùng lặp dữ liệu duy nhất (Unique constraint)
      case "P2002": {
        statusCode = HttpStatus.CONFLICT;
        const targetFields = (err.meta?.target as string[]) || [];
        message = `Dữ liệu trường '${targetFields.join(", ")}' đã tồn tại trong hệ thống`;
        break;
      }
      // P2025: Lỗi không tìm thấy bản ghi để sửa hoặc xóa
      case "P2025": {
        statusCode = HttpStatus.NOT_FOUND;
        message = "Không tìm thấy bản ghi yêu cầu trong cơ sở dữ liệu";
        break;
      }
      // P2003: Lỗi ràng buộc khóa ngoại (Foreign key)
      case "P2003": {
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Dữ liệu liên kết không hợp lệ hoặc không tồn tại";
        break;
      }
      default: {
        statusCode = HttpStatus.BAD_REQUEST;
        message = `Lỗi thao tác cơ sở dữ liệu (Mã: ${err.code})`;
        break;
      }
    }
  } else if (err.name === "TokenExpiredError") {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = "Mã xác thực (Token) không hợp lệ";
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Cú pháp dữ liệu JSON gửi lên không hợp lệ";
  } else {
    // Luôn ghi log lỗi 500 ra terminal để dev kiểm tra fix bug
    console.error("💥 [UNHANDLED ERROR]:", err);
    // Nếu ở môi trường dev, có thể gửi kèm stack để debug dễ hơn
    if (process.env.NODE_ENV === "development") {
      errorsDetails = {
        stack: err.stack,
        originalError: err.message,
      };
    }
  }

  return sendError(res, message, statusCode, errorsDetails);
};
