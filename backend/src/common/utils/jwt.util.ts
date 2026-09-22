import { SignOptions } from "jsonwebtoken";
import { AuthUser } from "../types/express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/app-error";

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "access_secret_key_default";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh_secret_key_default";
const JWT_ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ||
  "1h") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as SignOptions["expiresIn"];

export interface RefreshTokenPayload {
  id: string;
}

export const generateAccessToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): AuthUser => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AuthUser;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      );
    }
    throw new UnauthorizedError("Mã xác thực không hợp lệ");
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      );
    }
    throw new UnauthorizedError("Mã xác thực không hợp lệ");
  }
};
