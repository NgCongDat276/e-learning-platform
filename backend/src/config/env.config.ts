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

  // Cloudflare R2 Storage
  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
    BUCKET_NAME: process.env.R2_BUCKET_NAME || "elearning-storage",
    PUBLIC_URL: process.env.R2_PUBLIC_URL || "",
  },
} as const;
