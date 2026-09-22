import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

/**
 * Interface định nghĩa schema cần kiểm tra cho 1 request
 */
interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * @param schema Đối tượng chứa các Zod schema cho body, query, hoặc params
 */
export const validate = (schema: RequestValidationSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }

      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }

      // Dữ liệu hợp lệ -> Cho phép đi tiếp vào Controller
      next();
    } catch (error) {
      // Nếu có lỗi validate, chuyển tiếp thẳng sang errorHandler middleware
      next(error);
    }
  };
};
