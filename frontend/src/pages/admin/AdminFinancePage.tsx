import React, { useCallback, useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Space,
  Badge,
  Button,
  Skeleton,
  theme,
  App,
} from 'antd';
import {
  DollarOutlined,
  PercentageOutlined,
  BankOutlined,
  RiseOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { getAdminFinanceSummaryApi } from '../../api/revenue.api';
import type { AdminFinanceSummary } from '../../types/revenue.types';
import { AdminOrdersTab } from './components/finance/AdminOrdersTab';
import { CommissionSettingsTab } from './components/finance/CommissionSettingsTab';
import { AdminPayoutsTab } from './components/finance/AdminPayoutsTab';

const { Title, Text } = Typography;

export const AdminFinancePage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getAdminFinanceSummaryApi();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch {
      message.error('Failed to load finance summary');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await getAdminFinanceSummaryApi();
        if (!ignore && res.success && res.data) {
          setSummary(res.data);
        }
      } catch {
        if (!ignore) message.error('Failed to load finance summary');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [message]);

  const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;

  const cardStyle: React.CSSProperties = {
    borderRadius: 8,
    border: `1.5px solid ${token.colorBorder}`,
    boxShadow: `2px 2px 0 0 ${token.colorBorder}`,
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 40 }}>
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
          <DollarOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Finance & Settlement Management
            </Title>
            <Text type="secondary">
              PayOS revenue, Admin / Lecturer profit sharing settings, and payout approvals
            </Text>
          </div>
        </Space>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => void fetchSummary()}
          style={{ borderRadius: 4 }}
        >
          Refresh Data
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <RiseOutlined /> Total Platform GMV
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                {formatVnd(summary?.allTime.grossRevenue || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last 30 days: {formatVnd(summary?.period.grossRevenue || 0)} (
                {summary?.period.paidOrdersCount || 0} orders)
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <DollarOutlined /> Admin Net Profit
              </Text>
              <Title level={3} style={{ margin: 0, color: '#2563eb' }}>
                {formatVnd(summary?.allTime.adminProfit || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last 30 days: {formatVnd(summary?.period.adminProfit || 0)}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <WalletOutlined /> Lecturer Earnings
              </Text>
              <Title level={3} style={{ margin: 0, color: '#059669' }}>
                {formatVnd(summary?.allTime.lecturerNet || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last 30 days: {formatVnd(summary?.period.lecturerNet || 0)}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <BankOutlined /> Pending Payout Requests
              </Text>
              <Title level={3} style={{ margin: 0, color: '#f59e0b' }}>
                {formatVnd(summary?.pendingPayouts.totalAmount || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {summary?.pendingPayouts.count || 0} requests awaiting transfer
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={cardStyle}>
        <Tabs
          defaultActiveKey="orders"
          items={[
            {
              key: 'orders',
              label: (
                <span>
                  <ShoppingCartOutlined /> All Orders
                </span>
              ),
              children: <AdminOrdersTab onOrderSynced={() => void fetchSummary()} />,
            },
            {
              key: 'payouts',
              label: (
                <Space size={6}>
                  <BankOutlined />
                  <span>Payout Approvals (VietQR)</span>
                  {(summary?.pendingPayouts.count || 0) > 0 && (
                    <Badge count={summary?.pendingPayouts.count} />
                  )}
                </Space>
              ),
              children: <AdminPayoutsTab onPayoutUpdated={() => void fetchSummary()} />,
            },
            {
              key: 'commission',
              label: (
                <span>
                  <PercentageOutlined /> Commission Settings
                </span>
              ),
              children: <CommissionSettingsTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
};
