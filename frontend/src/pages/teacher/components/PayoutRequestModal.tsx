import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  App,
} from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { isAxiosError } from "axios";
import { createPayoutRequestApi } from "../../../api/revenue.api";
import type {
  BankAccountInfo,
  PayoutRequestItem,
} from "../../../types/revenue.types";

const { Text } = Typography;

interface PayoutRequestModalProps {
  open: boolean;
  availableBalance: number;
  minPayoutAmount: number;
  bankAccount: BankAccountInfo | null;
  onClose: () => void;
  onSuccess: (payout: PayoutRequestItem) => void;
}

interface PayoutFormValues {
  amount: number;
  lecturerNote?: string;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  open,
  availableBalance,
  minPayoutAmount,
  bankAccount,
  onClose,
  onSuccess,
}) => {
  console.log("🚀 ~ PayoutRequestModal ~ minPayoutAmount:", minPayoutAmount);
  const { message } = App.useApp();
  const [form] = Form.useForm<PayoutFormValues>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleFinish = async (values: PayoutFormValues) => {
    setSubmitting(true);
    try {
      const res = await createPayoutRequestApi({
        amount: values.amount,
        lecturerNote: values.lecturerNote?.trim() || undefined,
      });
      if (res.success && res.data) {
        message.success("Payout request submitted successfully");
        form.resetFields();
        onSuccess(res.data);
        onClose();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to submit payout request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <Space>
          <WalletOutlined />
          <span>Request Payout</span>
        </Space>
      }
    >
      {!bankAccount ? (
        <Alert
          type="warning"
          showIcon
          message="Bank account not configured"
          description="Please go to the Bank Account tab and save your payout bank details first."
        />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            amount: Math.min(
              availableBalance,
              Math.max(minPayoutAmount, availableBalance),
            ),
          }}
        >
          <div
            style={{
              background: "#fcfff7",
              border: "1px solid #262626",
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Available Balance:</Text>
                <Text strong style={{ color: "#059669" }}>
                  {availableBalance.toLocaleString("vi-VN")} ₫
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Minimum Payout:</Text>
                <Text>{minPayoutAmount.toLocaleString("vi-VN")} ₫</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Destination Bank:</Text>
                <Text strong>
                  {bankAccount.bankName} · {bankAccount.bankAccountNumber}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Account Holder:</Text>
                <Text strong>{bankAccount.bankAccountName}</Text>
              </div>
            </Space>
          </div>

          <Form.Item
            name="amount"
            label="Withdrawal Amount (VND)"
            rules={[
              { required: true, message: "Please enter withdrawal amount" },
              {
                validator: (_, value) => {
                  const num = Number(value || 0);
                  if (num < minPayoutAmount) {
                    return Promise.reject(
                      `Minimum payout amount is ${minPayoutAmount.toLocaleString("vi-VN")} ₫`,
                    );
                  }
                  if (num > availableBalance) {
                    return Promise.reject("Amount exceeds available balance");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={minPayoutAmount}
              max={availableBalance}
              step={50000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number((value || "").replace(/,/g, ""))}
              addonAfter="₫"
            />
          </Form.Item>

          <Form.Item name="lecturerNote" label="Note for Admin (Optional)">
            <Input.TextArea
              rows={2}
              placeholder="e.g. Monthly revenue settlement..."
              maxLength={300}
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose} style={{ borderRadius: 4 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={availableBalance < minPayoutAmount}
              style={{
                backgroundColor: "#a3e635",
                borderColor: "#262626",
                color: "#262626",
                fontWeight: 700,
                borderRadius: 4,
              }}
            >
              Submit Request
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};
