import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Button,
  Modal,
  Form,
  Input,
  Alert,
  Divider,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import {
  completeAdminPayoutApi,
  getAdminPayoutsApi,
  rejectAdminPayoutApi,
} from '../../../../api/revenue.api';
import type {
  PayoutRequestItem,
  PayoutStatus,
} from '../../../../types/revenue.types';

const { Text, Title } = Typography;

const PAYOUT_STATUS_TAG: Record<PayoutStatus, { color: string; label: string }> = {
  pending: { color: 'warning', label: 'Pending' },
  completed: { color: 'success', label: 'Completed' },
  rejected: { color: 'error', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

interface AdminPayoutsTabProps {
  onPayoutUpdated?: () => void;
}

export const AdminPayoutsTab: React.FC<AdminPayoutsTabProps> = ({
  onPayoutUpdated,
}) => {
  const { message } = App.useApp();

  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<PayoutStatus | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestItem | null>(
    null
  );
  const [modalMode, setModalMode] = useState<'complete' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [completeForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPayoutsApi({ page, limit: 10, status });
      if (res.success && res.data) {
        setPayouts(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch {
      message.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  }, [page, status, message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await getAdminPayoutsApi({ page, limit: 10, status });
        if (!ignore && res.success && res.data) {
          setPayouts(res.data);
          setTotal(res.pagination?.total || res.data.length);
        }
      } catch {
        if (!ignore) message.error('Failed to load payout requests');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [page, status, message]);

  const handleCompleteSubmit = async (values: {
    transactionReference: string;
    adminNote?: string;
  }) => {
    if (!selectedPayout) return;
    setSubmitting(true);
    try {
      const res = await completeAdminPayoutApi(selectedPayout.id, {
        transactionReference: values.transactionReference.trim(),
        adminNote: values.adminNote?.trim() || undefined,
      });
      if (res.success) {
        message.success('Payout marked as completed');
        setSelectedPayout(null);
        setModalMode(null);
        completeForm.resetFields();
        await fetchPayouts();
        if (onPayoutUpdated) onPayoutUpdated();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to complete payout request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (values: { adminNote: string }) => {
    if (!selectedPayout) return;
    setSubmitting(true);
    try {
      const res = await rejectAdminPayoutApi(selectedPayout.id, {
        adminNote: values.adminNote.trim(),
      });
      if (res.success) {
        message.success('Payout request rejected and balance refunded to lecturer');
        setSelectedPayout(null);
        setModalMode(null);
        rejectForm.resetFields();
        await fetchPayouts();
        if (onPayoutUpdated) onPayoutUpdated();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to reject payout request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;

  const columns: ColumnsType<PayoutRequestItem> = [
    {
      title: 'Lecturer',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.lecturer?.fullName || 'Lecturer'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.lecturer?.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (v: number) => (
        <Text strong style={{ color: '#059669' }}>
          {formatVnd(v)}
        </Text>
      ),
    },
    {
      title: 'Destination Bank',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {r.bankName} · {r.bankAccountNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.bankAccountName} · Memo: <Text code>{r.transferContent}</Text>
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (st: PayoutStatus) => {
        const cfg = PAYOUT_STATUS_TAG[st];
        return (
          <Tag color={cfg.color} style={{ borderRadius: 9999, fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (d: string) => new Date(d).toLocaleString('en-GB'),
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={() => {
                setSelectedPayout(r);
                setModalMode('complete');
              }}
              style={{
                backgroundColor: '#a3e635',
                borderColor: '#262626',
                color: '#262626',
                fontWeight: 600,
                borderRadius: 4,
              }}
            >
              Pay & Approve
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelectedPayout(r);
                setModalMode('reject');
              }}
              style={{ borderRadius: 4 }}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
            {r.transactionReference && <Text code>{r.transactionReference}</Text>}
            {r.adminNote && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.adminNote}
              </Text>
            )}
          </Space>
        ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Select
          allowClear
          placeholder="Filter by status"
          style={{ width: 200 }}
          value={status}
          onChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={() => void fetchPayouts()}
          style={{ borderRadius: 4 }}
        >
          Refresh
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={payouts}
        loading={loading}
        scroll={{ x: 920 }}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (nextPage) => setPage(nextPage),
        }}
      />

      <Modal
        open={modalMode === 'complete' && !!selectedPayout}
        onCancel={() => {
          setModalMode(null);
          setSelectedPayout(null);
        }}
        footer={null}
        width={520}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#059669' }} />
            <span>Scan VietQR to Pay Lecturer</span>
          </Space>
        }
      >
        {selectedPayout && (
          <div>
            <Alert
              type="info"
              showIcon
              message="Scan the VietQR code below with your banking app to transfer the exact amount, then enter the bank transaction reference to complete."
              style={{ marginBottom: 16, borderRadius: 6 }}
            />

            <div
              style={{
                textAlign: 'center',
                background: '#fcfff7',
                border: '1.5px solid #262626',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <img
                src={selectedPayout.vietqrUrl}
                alt="VietQR Payout"
                style={{
                  maxWidth: 260,
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                }}
              />
              <Title level={4} style={{ margin: '10px 0 2px 0', color: '#059669' }}>
                {formatVnd(selectedPayout.amount)}
              </Title>
              <Text strong>
                {selectedPayout.bankName} · {selectedPayout.bankAccountNumber}
              </Text>
              <br />
              <Text type="secondary">
                {selectedPayout.bankAccountName} · Memo:{' '}
                <Text code>{selectedPayout.transferContent}</Text>
              </Text>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Form
              form={completeForm}
              layout="vertical"
              onFinish={handleCompleteSubmit}
            >
              <Form.Item
                name="transactionReference"
                label="Bank Transaction Reference"
                rules={[
                  { required: true, message: 'Please enter the bank transaction reference' },
                ]}
              >
                <Input placeholder="e.g. FT261123998811" style={{ borderRadius: 4 }} />
              </Form.Item>
              <Form.Item name="adminNote" label="Settlement Note (Optional)">
                <Input.TextArea rows={2} placeholder="e.g. Transferred via VCB" />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  onClick={() => {
                    setModalMode(null);
                    setSelectedPayout(null);
                  }}
                  style={{ borderRadius: 4 }}
                >
                  Close
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{
                    backgroundColor: '#a3e635',
                    borderColor: '#262626',
                    color: '#262626',
                    fontWeight: 700,
                    borderRadius: 4,
                  }}
                >
                  Confirm Transfer Completed
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        open={modalMode === 'reject' && !!selectedPayout}
        onCancel={() => {
          setModalMode(null);
          setSelectedPayout(null);
        }}
        footer={null}
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ef4444' }} />
            <span>Reject Payout Request</span>
          </Space>
        }
      >
        {selectedPayout && (
          <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
            <Alert
              type="warning"
              showIcon
              message={`${formatVnd(selectedPayout.amount)} will be refunded to the Available Balance of ${selectedPayout.lecturer?.fullName || 'the lecturer'}.`}
              style={{ marginBottom: 16, borderRadius: 6 }}
            />
            <Form.Item
              name="adminNote"
              label="Rejection Reason"
              rules={[
                { required: true, message: 'Please provide a rejection reason' },
                { min: 3, message: 'Reason must be at least 3 characters' },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="e.g. Bank account holder name mismatch..."
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                onClick={() => {
                  setModalMode(null);
                  setSelectedPayout(null);
                }}
                style={{ borderRadius: 4 }}
              >
                Close
              </Button>
              <Button
                danger
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ borderRadius: 4 }}
              >
                Confirm Rejection
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};
