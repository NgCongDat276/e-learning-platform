import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Button, Typography, Space, Alert, theme, App } from 'antd';
import { BankOutlined, SaveOutlined } from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { VIETNAM_BANKS } from '../../../constants/vietnam-banks';
import { updateLecturerBankAccountApi } from '../../../api/revenue.api';
import type { BankAccountInfo } from '../../../types/revenue.types';

const { Title, Text } = Typography;

interface BankAccountFormCardProps {
  bankAccount: BankAccountInfo | null;
  onSuccess: (updated: BankAccountInfo) => void;
}

interface BankFormValues {
  bankBin: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export const BankAccountFormCard: React.FC<BankAccountFormCardProps> = ({
  bankAccount,
  onSuccess,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [form] = Form.useForm<BankFormValues>();
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (bankAccount) {
      form.setFieldsValue({
        bankBin: bankAccount.bankBin,
        bankAccountNumber: bankAccount.bankAccountNumber,
        bankAccountName: bankAccount.bankAccountName,
      });
    }
  }, [bankAccount, form]);

  const handleSubmit = async (values: BankFormValues) => {
    const selectedBank = VIETNAM_BANKS.find((b) => b.bin === values.bankBin);
    if (!selectedBank) {
      message.error('Please select a valid bank');
      return;
    }

    setSaving(true);
    try {
      const res = await updateLecturerBankAccountApi({
        bankBin: selectedBank.bin,
        bankName: selectedBank.shortName,
        bankAccountNumber: values.bankAccountNumber.trim(),
        bankAccountName: values.bankAccountName.trim().toUpperCase(),
      });
      if (res.success && res.data) {
        message.success('Bank account updated successfully');
        onSuccess(res.data);
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save bank account details');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 8,
        border: `1.5px solid ${token.colorBorder}`,
        boxShadow: `2px 2px 0 0 ${token.colorBorder}`,
        maxWidth: 640,
      }}
    >
      <Space align="center" style={{ marginBottom: 16 }}>
        <BankOutlined style={{ fontSize: 22 }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Payout Bank Account (VietQR)
          </Title>
          <Text type="secondary">
            Admin will transfer payouts directly via VietQR to this account upon approval.
          </Text>
        </div>
      </Space>

      <Alert
        type="info"
        showIcon
        message="Please enter your exact account number and uppercase account holder name without accents (e.g. NGUYEN VAN A)."
        style={{ marginBottom: 20, borderRadius: 6 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="bankBin"
          label="Bank"
          rules={[{ required: true, message: 'Please select a bank' }]}
        >
          <Select
            showSearch
            placeholder="Search and select a bank (VCB, MB, Techcombank...)"
            optionFilterProp="label"
            options={VIETNAM_BANKS.map((b) => ({
              value: b.bin,
              label: `${b.shortName} — ${b.name}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="bankAccountNumber"
          label="Account Number"
          rules={[
            { required: true, message: 'Please enter your account number' },
            { pattern: /^[A-Za-z0-9]+$/, message: 'Account number must contain letters and digits only' },
          ]}
        >
          <Input placeholder="e.g. 1012345678" style={{ borderRadius: 4 }} />
        </Form.Item>

        <Form.Item
          name="bankAccountName"
          label="Account Holder Name (Uppercase, no accents)"
          rules={[{ required: true, message: 'Please enter the account holder name' }]}
        >
          <Input
            placeholder="e.g. NGUYEN CONG DAT"
            style={{ borderRadius: 4, textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={saving}
          icon={<SaveOutlined />}
          style={{
            backgroundColor: '#a3e635',
            borderColor: '#262626',
            color: '#262626',
            fontWeight: 700,
            borderRadius: 4,
            boxShadow: '2px 2px 0 0 #262626',
          }}
        >
          Save Bank Account
        </Button>
      </Form>
    </Card>
  );
};
