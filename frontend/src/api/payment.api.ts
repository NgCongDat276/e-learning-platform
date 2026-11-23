import axiosClient from './axios-client';
import type { ApiResponse } from '../types/api';
import type {
  OrderItem,
  OrderStatus,
  OrderStatusPollingResult,
} from '../types/payment.types';

export const createPaymentOrderApi = async (
  courseIdOrSlug: string
): Promise<ApiResponse<OrderItem>> => {
  const response = (await axiosClient.post('/payments/orders', {
    courseId: courseIdOrSlug,
  })) as unknown as ApiResponse<OrderItem>;
  return response;
};

export const getMyOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}): Promise<ApiResponse<OrderItem[]>> => {
  const response = (await axiosClient.get('/payments/orders/my', {
    params,
  })) as unknown as ApiResponse<OrderItem[]>;
  return response;
};

export const getOrderDetailApi = async (
  orderCode: number | string
): Promise<ApiResponse<OrderItem>> => {
  const response = (await axiosClient.get(
    `/payments/orders/${orderCode}`
  )) as unknown as ApiResponse<OrderItem>;
  return response;
};

export const getOrderStatusApi = async (
  orderCode: number | string
): Promise<ApiResponse<OrderStatusPollingResult>> => {
  const response = (await axiosClient.get(
    `/payments/orders/${orderCode}/status`
  )) as unknown as ApiResponse<OrderStatusPollingResult>;
  return response;
};

export const syncOrderWithPayOSApi = async (
  orderCode: number | string
): Promise<ApiResponse<OrderItem>> => {
  const response = (await axiosClient.post(
    `/payments/orders/${orderCode}/sync`
  )) as unknown as ApiResponse<OrderItem>;
  return response;
};

export const cancelPaymentOrderApi = async (
  orderCode: number | string
): Promise<ApiResponse<OrderItem>> => {
  const response = (await axiosClient.post(
    `/payments/orders/${orderCode}/cancel`
  )) as unknown as ApiResponse<OrderItem>;
  return response;
};
