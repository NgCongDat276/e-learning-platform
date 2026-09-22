import dotenv from "dotenv";

dotenv.config();

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || "",

  //JWT
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret_key_default",
    REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || "refresh_secret_key_default",
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
} as const;
