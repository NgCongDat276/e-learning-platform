import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  PaymentLink,
} from "@payos/node/lib/resources/v2/payment-requests/payment-requests";
import type {
  Webhook,
  WebhookData,
} from "@payos/node/lib/resources/webhooks/webhook";
import { getPayOSClient } from "../../config/payos";

export class PayOSGateway {
  /**
   * Tạo link thanh toán & mã VietQR trên PayOS.
   */
  async createPaymentLink(
    payload: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse> {
    const client = getPayOSClient();
    return client.paymentRequests.create(payload);
  }

  /**
   * Truy vấn trạng thái thanh toán thực tế từ PayOS theo orderCode.
   */
  async getPaymentLinkInfo(orderCode: number): Promise<PaymentLink> {
    const client = getPayOSClient();
    return client.paymentRequests.get(orderCode);
  }

  /**
   * Hủy link thanh toán trên PayOS theo orderCode.
   */
  async cancelPaymentLink(
    orderCode: number,
    cancellationReason?: string,
  ): Promise<PaymentLink> {
    const client = getPayOSClient();
    return client.paymentRequests.cancel(orderCode, cancellationReason);
  }

  /**
   * Xác thực chữ ký HMAC-SHA256 của Webhook do PayOS gửi về.
   */
  async verifyWebhook(payload: Webhook): Promise<WebhookData> {
    const client = getPayOSClient();
    return client.webhooks.verify(payload);
  }
}

export const payosGateway = new PayOSGateway();
