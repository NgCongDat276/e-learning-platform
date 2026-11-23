import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Typography, Space, Input, Select, Button, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { getAdminOrdersApi } from '../../../../api/revenue.api';
import { syncOrderWithPayOSApi } from '../../../../api/payment.api';
import type { OrderStatus } from '../../../../types/payment.types';
import type { AdminOrderItem } from '../../../../types/revenue.types';

const { Text } = Typography;

const ORDER_STATUS_TAG: Record<OrderStatus, { color: string; label: string }> = {
  pending: { color: 'warning', label: 'Pending' },
  paid: { color: 'success', label: 'Paid' },
  cancelled: { color: 'default', label: 'Cancelled' },
  expired: { color: 'error', label: 'Expired' },
  refunded: { color: 'purple', label: 'Refunded' },
};

const SOURCE_LABEL: Record<string, string> = {
  global: 'Global',
  lecturer: 'Lecturer',
  course: 'Course',
};

interface AdminOrdersTabProps {
  onOrderSynced?: () => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  onOrderSynced,
}) => {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingCode, setSyncingCode] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [search, setSearch] = useState<string>('');

  const fetchOrders = useCallback(
    async (nextPage = page, nextStatus = status, nextSearch = search) => {
      setLoading(true);
      try {
        const res = await getAdminOrdersApi({
          page: nextPage,
          limit: 10,
          status: nextStatus,
          search: nextSearch.trim() || undefined,
        });
        if (res.success && res.data) {
          setOrders(res.data);
          setTotal(res.pagination?.total || res.data.length);
        }
      } catch {
        message.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [page, status, search, message]
  );

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await getAdminOrdersApi({
          page,
          limit: 10,
          status,
          search: search.trim() || undefined,
        });
        if (!ignore && res.success && res.data) {
          setOrders(res.data);
          setTotal(res.pagination?.total || res.data.length);
        }
      } catch {
        if (!ignore) message.error('Failed to load orders');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [page, status, search, message]);

  const handleSync = async (orderCode: number) => {
    setSyncingCode(orderCode);
    try {
      const res = await syncOrderWithPayOSApi(orderCode);
      if (res.success && res.data) {
        message.success(
          `Order #${orderCode} synced: ${res.data.status.toUpperCase()}`
        );
        await fetchOrders();
        if (res.data.status === 'paid' && onOrderSynced) {
          onOrderSynced();
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to sync with PayOS');
      }
    } finally {
      setSyncingCode(null);
    }
  };

  const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;

  const columns: ColumnsType<AdminOrderItem> = [
    {
      title: 'Order ID',
      dataIndex: 'orderCode',
      render: (c: number) => <Text strong>#{c}</Text>,
    },
    {
      title: 'Course & Lecturer',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.course.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lecturer: {r.lecturer.fullName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Student',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text>{r.buyer.fullName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.buyer.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Amount (GMV)',
      dataIndex: 'grossAmount',
      align: 'right',
      render: (v: number) => <Text strong>{formatVnd(v)}</Text>,
    },
    {
      title: 'Revenue Split (Admin / Lecturer)',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            Admin ({r.platformFeeRate}%):{' '}
            <Text strong style={{ color: '#2563eb' }}>
              {formatVnd(r.platformFeeAmount)}
            </Text>
          </Text>
          <Text style={{ fontSize: 12 }}>
            Lecturer: <Text strong style={{ color: '#059669' }}>{formatVnd(r.lecturerNetAmount)}</Text>{' '}
            <Tag style={{ borderRadius: 9999, fontSize: 10 }}>
              {SOURCE_LABEL[r.commissionSource] || r.commissionSource}
            </Tag>
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (st: OrderStatus) => {
        const cfg = ORDER_STATUS_TAG[st];
        return (
          <Tag color={cfg.color} style={{ borderRadius: 9999, fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Timestamp',
      render: (_, r) =>
        new Date(r.paidAt || r.createdAt).toLocaleString('en-GB'),
    },
    {
      title: 'Reconciliation',
      align: 'right',
      render: (_, r) =>
        r.status === 'pending' || r.status === 'expired' ? (
          <Button
            size="small"
            icon={<SyncOutlined spin={syncingCode === r.orderCode} />}
            loading={syncingCode === r.orderCode}
            onClick={() => void handleSync(r.orderCode)}
            style={{ borderRadius: 4 }}
          >
            Sync PayOS
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.payosReference || '-'}
          </Text>
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
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search order ID, email, course..."
            style={{ width: 280 }}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 170 }}
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void fetchOrders()}
          style={{ borderRadius: 4 }}
        >
          Refresh
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        scroll={{ x: 960 }}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (nextPage) => setPage(nextPage),
        }}
      />
    </div>
  );
};
