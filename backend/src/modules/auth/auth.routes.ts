import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../common/middlewares/validate";
import { authenticate } from "../../common/middlewares/authenticate";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema";

const router = Router();

// 1. Đăng ký tài khoản (Public)
router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);

// 2. Đăng nhập (Public)
router.post("/login", validate({ body: loginSchema }), authController.login);

// 3. Cấp lại Access Token mới (Public)
router.post(
  "/refresh-token",
  validate({ body: refreshTokenSchema }),
  authController.refreshToken,
);

// 4. Lấy thông tin tài khoản hiện tại (Protected: Cần đăng nhập)
router.get("/me", authenticate, authController.getMe);

export default router;
