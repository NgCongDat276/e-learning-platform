import { user_role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: user_role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
