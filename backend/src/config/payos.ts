import { PayOS } from "@payos/node";
import { envConfig } from "./env.config";
import { InternalServerError } from "../common/errors/app-error";

let payosInstance: PayOS | null = null;

/**
 * Kiểm tra hệ thống đã cấu hình đủ bộ 3 key của PayOS chưa.
 */
export function isPayOSConfigured(): boolean {
  const { CLIENT_ID, API_KEY, CHECKSUM_KEY } = envConfig.PAYOS;
  return Boolean(
    CLIENT_ID.trim() && API_KEY.trim() && CHECKSUM_KEY.trim(),
  );
}

/**
 * Trả về singleton PayOS client.
 * Chỉ khởi tạo khi có đủ credentials để tránh làm sập server khi chưa cấu hình .env.
 */
export function getPayOSClient(): PayOS {
  if (!isPayOSConfigured()) {
    throw new InternalServerError(
      "PayOS is not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY in backend/.env.",
    );
  }

  if (!payosInstance) {
    payosInstance = new PayOS({
      clientId: envConfig.PAYOS.CLIENT_ID.trim(),
      apiKey: envConfig.PAYOS.API_KEY.trim(),
      checksumKey: envConfig.PAYOS.CHECKSUM_KEY.trim(),
    });
  }

  return payosInstance;
}
