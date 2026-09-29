import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import {
  updateProfileSchema,
  changePasswordSchema,
  queryUsersSchema,
  updateUserStatusSchema,
} from "./users.schema";
import { user_role } from "@prisma/client";

const router = Router();

// 1. Lấy thông tin cá nhân (Protected)
router.get("/profile", authenticate, usersController.getProfile);

// 2. Cập nhật thông tin cá nhân (Protected)
router.put(
  "/profile",
  authenticate,
  validate({ body: updateProfileSchema }),
  usersController.updateProfile,
);

// 3. Đổi mật khẩu tài khoản (Protected)
router.put(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  usersController.changePassword,
);

// 4. Danh sách người dùng (Protected: Admin)
router.get(
  "/",
  authenticate,
  authorize(user_role.admin),
  validate({ query: queryUsersSchema }),
  usersController.getUsersList,
);

// 5. Khóa / Kích hoạt tài khoản (Protected: Admin)
router.patch(
  "/:id/status",
  authenticate,
  authorize(user_role.admin),
  validate({ body: updateUserStatusSchema }),
  usersController.updateUserStatus,
);

export default router;
