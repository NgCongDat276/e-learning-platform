import React, { useCallback, useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Popconfirm,
  Skeleton,
  theme,
  App,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  WalletOutlined,
  BankOutlined,
  HistoryOutlined,
  ReloadOutlined,
  PlusOutlined,
  RiseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { isAxiosError } from "axios";
import {
  cancelPayoutRequestApi,
  getLecturerPaidOrdersApi,
  getLecturerPayoutsApi,
  getLecturerRevenueOverviewApi,
  getLecturerTransactionsApi,
} from "../../api/revenue.api";
import type {
  BankAccountInfo,
  LecturerPaidOrderItem,
  LecturerRevenueOverview,
  PayoutRequestItem,
  PayoutStatus,
  WalletTransactionItem,
  WalletTxType,
} from "../../types/revenue.types";
import { BankAccountFormCard } from "./components/BankAccountFormCard";
import { PayoutRequestModal } from "./components/PayoutRequestModal";

const { Title, Text } = Typography;

const PAYOUT_STATUS_TAG: Record<
  PayoutStatus,
  { color: string; label: string }
> = {
  pending: { color: "warning", label: "Pending" },
  completed: { color: "success", label: "Completed" },
  rejected: { color: "error", label: "Rejected" },
  cancelled: { color: "default", label: "Cancelled" },
};

const TX_TYPE_TAG: Record<WalletTxType, { color: string; label: string }> = {
  course_sale: { color: "success", label: "Course Sale" },
  payout_hold: { color: "warning", label: "Payout Hold" },
  payout_completed: { color: "blue", label: "Payout Completed" },
  payout_refund: { color: "cyan", label: "Balance Refund" },
  adjustment: { color: "purple", label: "Adjustment" },
};

export const TeacherRevenuePage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const [overview, setOverview] = useState<LecturerRevenueOverview | null>(
    null,
  );
  const [orders, setOrders] = useState<LecturerPaidOrderItem[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);
  const [ordersPage, setOrdersPage] = useState<number>(1);

  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([]);
  const [payoutsTotal, setPayoutsTotal] = useState<number>(0);
  const [payoutsPage, setPayoutsPage] = useState<number>(1);

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [txTotal, setTxTotal] = useState<number>(0);
  const [txPage, setTxPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);

  const loadAll = useCallback(
    async (oPage = ordersPage, pPage = payoutsPage, tPage = txPage) => {
      try {
        const [ovRes, ordRes, payRes, txRes] = await Promise.all([
          getLecturerRevenueOverviewApi(),
          getLecturerPaidOrdersApi({ page: oPage, limit: 10 }),
          getLecturerPayoutsApi({ page: pPage, limit: 10 }),
          getLecturerTransactionsApi({ page: tPage, limit: 10 }),
        ]);

        if (ovRes.success && ovRes.data) setOverview(ovRes.data);
        if (ordRes.success && ordRes.data) {
          setOrders(ordRes.data);
          setOrdersTotal(ordRes.pagination?.total || ordRes.data.length);
        }
        if (payRes.success && payRes.data) {
          setPayouts(payRes.data);
          setPayoutsTotal(payRes.pagination?.total || payRes.data.length);
        }
        if (txRes.success && txRes.data) {
          setTransactions(txRes.data);
          setTxTotal(txRes.pagination?.total || txRes.data.length);
        }
      } catch {
        message.error("Failed to load lecturer revenue data");
      } finally {
        setLoading(false);
      }
    },
    [ordersPage, payoutsPage, txPage, message],
  );

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      try {
        const [ovRes, ordRes, payRes, txRes] = await Promise.all([
          getLecturerRevenueOverviewApi(),
          getLecturerPaidOrdersApi({ page: 1, limit: 10 }),
          getLecturerPayoutsApi({ page: 1, limit: 10 }),
          getLecturerTransactionsApi({ page: 1, limit: 10 }),
        ]);
        if (ignore) return;
        if (ovRes.success && ovRes.data) setOverview(ovRes.data);
        if (ordRes.success && ordRes.data) {
          setOrders(ordRes.data);
          setOrdersTotal(ordRes.pagination?.total || ordRes.data.length);
        }
        if (payRes.success && payRes.data) {
          setPayouts(payRes.data);
          setPayoutsTotal(payRes.pagination?.total || payRes.data.length);
        }
        if (txRes.success && txRes.data) {
          setTransactions(txRes.data);
          setTxTotal(txRes.pagination?.total || txRes.data.length);
        }
      } catch {
        if (!ignore) message.error("Failed to load revenue data");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void init();
    return () => {
      ignore = true;
    };
  }, [message]);

  const handleCancelPayout = async (payoutId: string) => {
    try {
      const res = await cancelPayoutRequestApi(payoutId);
      if (res.success) {
        message.success("Payout request cancelled and balance refunded");
        await loadAll();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to cancel payout request");
      }
    }
  };

  const formatVnd = (val: number) => `${val.toLocaleString("vi-VN")} ₫`;

  const cardStyle: React.CSSProperties = {
    borderRadius: 8,
    border: `1.5px solid ${token.colorBorder}`,
    boxShadow: `2px 2px 0 0 ${token.colorBorder}`,
  };

  const orderColumns: ColumnsType<LecturerPaidOrderItem> = [
    {
      title: "Order ID",
      dataIndex: "orderCode",
      render: (c: number) => <Text strong>#{c}</Text>,
    },
    {
      title: "Course",
      render: (_, r) => <Text strong>{r.course.title}</Text>,
    },
    {
      title: "Student",
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
      title: "Sale Price",
      dataIndex: "grossAmount",
      align: "right",
      render: (v: number) => formatVnd(v),
    },
    {
      title: "Platform Fee",
      align: "right",
      render: (_, r) => (
        <Text type="secondary">
          {r.platformFeeRate}% (-{formatVnd(r.platformFeeAmount)})
        </Text>
      ),
    },
    {
      title: "Net Earnings",
      dataIndex: "lecturerNetAmount",
      align: "right",
      render: (v: number) => (
        <Text strong style={{ color: "#059669" }}>
          +{formatVnd(v)}
        </Text>
      ),
    },
    {
      title: "Paid At",
      dataIndex: "paidAt",
      render: (d: string | null) =>
        d ? new Date(d).toLocaleString("en-GB") : "-",
    },
  ];

  const payoutColumns: ColumnsType<PayoutRequestItem> = [
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleString("en-GB"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right",
      render: (v: number) => <Text strong>{formatVnd(v)}</Text>,
    },
    {
      title: "Destination Bank",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {r.bankName} · {r.bankAccountNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.bankAccountName} ({r.transferContent})
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: PayoutStatus) => {
        const cfg = PAYOUT_STATUS_TAG[status];
        return (
          <Tag
            color={cfg.color}
            style={{ borderRadius: 9999, fontWeight: 600 }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Reference / Note",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          {r.transactionReference && <Text code>{r.transactionReference}</Text>}
          {r.adminNote && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Admin: {r.adminNote}
            </Text>
          )}
          {!r.transactionReference && !r.adminNote && (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      align: "right",
      render: (_, r) =>
        r.status === "pending" ? (
          <Popconfirm
            title="Cancel payout request?"
            description="The amount will be refunded to your Available Balance."
            onConfirm={() => void handleCancelPayout(r.id)}
            okText="Cancel Request"
            cancelText="Close"
          >
            <Button danger size="small" style={{ borderRadius: 4 }}>
              Cancel
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const txColumns: ColumnsType<WalletTransactionItem> = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleString("en-GB"),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type: WalletTxType) => {
        const cfg = TX_TYPE_TAG[type];
        return (
          <Tag
            color={cfg.color}
            style={{ borderRadius: 9999, fontWeight: 600 }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Change",
      dataIndex: "amount",
      align: "right",
      render: (v: number) => (
        <Text
          strong
          style={{ color: v > 0 ? "#059669" : v < 0 ? "#ef4444" : "#525252" }}
        >
          {v > 0 ? `+${formatVnd(v)}` : formatVnd(v)}
        </Text>
      ),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      align: "right",
      render: (v: number) => formatVnd(v),
    },
    {
      title: "Description",
      dataIndex: "description",
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const wallet = overview?.wallet;

  console.log("🚀 ~ TeacherRevenuePage ~ overview:", overview);
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space align="center">
          <WalletOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Revenue & Lecturer Wallet
            </Title>
            <Text type="secondary">
              Track course sales earnings, revenue sharing rate, and payout
              history
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadAll()}
            style={{ borderRadius: 4 }}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setPayoutModalOpen(true)}
            style={{
              backgroundColor: "#a3e635",
              borderColor: "#262626",
              color: "#262626",
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: "2px 2px 0 0 #262626",
            }}
          >
            Request Payout
          </Button>
        </Space>
      </div>

      {overview && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message={
            <Text strong>
              Your current revenue share: Lecturer{" "}
              {overview.commission.lecturerShareRate}% · Platform Fee{" "}
              {overview.commission.platformFeeRate}% (
              {overview.commission.source === "lecturer"
                ? "Custom lecturer rate"
                : "Global default rate"}
              )
            </Text>
          }
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <RiseOutlined /> Gross Sales (GMV)
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                {formatVnd(wallet?.totalGrossRevenue || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {overview?.paidOrdersCount || 0} paid orders
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <DollarOutlined /> Total Net Earned
              </Text>
              <Title level={3} style={{ margin: 0, color: "#2563eb" }}>
                {formatVnd(wallet?.totalNetEarned || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Platform fee deducted:{" "}
                {formatVnd(wallet?.totalPlatformFee || 0)}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <WalletOutlined /> Available Balance
              </Text>
              <Title level={3} style={{ margin: 0, color: "#059669" }}>
                {formatVnd(wallet?.availableBalance || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pending payout: {formatVnd(wallet?.pendingPayoutBalance || 0)}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <BankOutlined /> Total Withdrawn
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                {formatVnd(wallet?.withdrawnBalance || 0)}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Min payout: {formatVnd(overview?.minPayoutAmount || 10000)}
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
              key: "orders",
              label: (
                <span>
                  <DollarOutlined /> Paid Orders ({ordersTotal})
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={orderColumns}
                  dataSource={orders}
                  scroll={{ x: 800 }}
                  pagination={{
                    current: ordersPage,
                    pageSize: 10,
                    total: ordersTotal,
                    onChange: (p) => {
                      setOrdersPage(p);
                      void loadAll(p, payoutsPage, txPage);
                    },
                  }}
                />
              ),
            },
            {
              key: "payouts",
              label: (
                <span>
                  <WalletOutlined /> Payout Requests ({payoutsTotal})
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={payoutColumns}
                  dataSource={payouts}
                  scroll={{ x: 800 }}
                  pagination={{
                    current: payoutsPage,
                    pageSize: 10,
                    total: payoutsTotal,
                    onChange: (p) => {
                      setPayoutsPage(p);
                      void loadAll(ordersPage, p, txPage);
                    },
                  }}
                />
              ),
            },
            {
              key: "ledger",
              label: (
                <span>
                  <HistoryOutlined /> Balance Ledger
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={txColumns}
                  dataSource={transactions}
                  scroll={{ x: 800 }}
                  pagination={{
                    current: txPage,
                    pageSize: 10,
                    total: txTotal,
                    onChange: (p) => {
                      setTxPage(p);
                      void loadAll(ordersPage, payoutsPage, p);
                    },
                  }}
                />
              ),
            },
            {
              key: "bank",
              label: (
                <span>
                  <BankOutlined /> Bank Account
                </span>
              ),
              children: (
                <BankAccountFormCard
                  bankAccount={overview?.bankAccount || null}
                  onSuccess={(updated: BankAccountInfo) => {
                    setOverview((prev) =>
                      prev ? { ...prev, bankAccount: updated } : prev,
                    );
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <PayoutRequestModal
        open={payoutModalOpen}
        availableBalance={wallet?.availableBalance || 0}
        minPayoutAmount={overview?.minPayoutAmount || 10000}
        bankAccount={overview?.bankAccount || null}
        onClose={() => setPayoutModalOpen(false)}
        onSuccess={() => {
          void loadAll();
        }}
      />
    </div>
  );
};
