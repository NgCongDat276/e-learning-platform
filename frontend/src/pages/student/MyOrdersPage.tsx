import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Select,
  theme,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CreditCardOutlined,
  PlayCircleOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyOrdersApi } from '../../api/payment.api';
import type { OrderItem, OrderStatus } from '../../types/payment.types';

const { Title, Text } = Typography;

const STATUS_TAG_CONFIG: Record<
  OrderStatus,
  { color: string; label: string }
> = {
  pending: { color: 'warning', label: 'Pending' },
  paid: { color: 'success', label: 'Paid' },
  cancelled: { color: 'default', label: 'Cancelled' },
  expired: { color: 'error', label: 'Expired' },
  refunded: { color: 'purple', label: 'Refunded' },
};

export const MyOrdersPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyOrdersApi({
        page,
        limit: 10,
        status: statusFilter,
      });
      if (res.success && res.data) {
        setOrders(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch {
      message.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await getMyOrdersApi({
          page,
          limit: 10,
          status: statusFilter,
        });
        if (!ignore && res.success && res.data) {
          setOrders(res.data);
          setTotal(res.pagination?.total || res.data.length);
        }
      } catch {
        if (!ignore) {
          message.error('Failed to load order history');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [page, statusFilter, message]);

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'Order ID',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (code: number) => <Text strong>#{code}</Text>,
    },
    {
      title: 'Course',
      key: 'course',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.course?.title || 'Course'}</Text>
          {record.course?.instructor && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Instructor: {record.course.instructor.fullName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      align: 'right',
      render: (amount: number) => (
        <Text strong>{amount.toLocaleString('vi-VN')} ₫</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const cfg = STATUS_TAG_CONFIG[status] || {
          color: 'default',
          label: status,
        };
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
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('en-GB'),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        if (record.status === 'pending') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => navigate(`/checkout/${record.orderCode}`)}
              style={{
                backgroundColor: '#a3e635',
                borderColor: '#262626',
                color: '#262626',
                fontWeight: 600,
                borderRadius: 4,
              }}
            >
              Pay Now
            </Button>
          );
        }
        if (record.status === 'paid' && record.course?.slug) {
          return (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/courses/${record.course!.slug}/learn`)}
              style={{ borderRadius: 4 }}
            >
              Go to Course
            </Button>
          );
        }
        return (
          <Button
            size="small"
            onClick={() => navigate(`/checkout/${record.orderCode}`)}
            style={{ borderRadius: 4 }}
          >
            Details
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 40 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space align="center">
          <CreditCardOutlined style={{ fontSize: 24 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              My Orders
            </Title>
            <Text type="secondary">
              Track your course payment orders via PayOS VietQR
            </Text>
          </div>
        </Space>

        <Space>
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 170 }}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void fetchOrders()}
            style={{ borderRadius: 4 }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Card
        style={{
          borderRadius: 8,
          border: `1.5px solid ${token.colorBorder}`,
          boxShadow: `2px 2px 0 0 ${token.colorBorder}`,
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          scroll={{ x: 760 }}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </Card>
    </div>
  );
};
