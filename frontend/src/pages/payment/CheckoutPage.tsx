import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tag,
  Space,
  Divider,
  Skeleton,
  Steps,
  Alert,
  Popconfirm,
  theme,
  App,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  cancelPaymentOrderApi,
  createPaymentOrderApi,
  getOrderDetailApi,
  getOrderStatusApi,
  syncOrderWithPayOSApi,
} from '../../api/payment.api';
import { findBankByBin } from '../../constants/vietnam-banks';
import type { OrderItem } from '../../types/payment.types';

const { Title, Text, Paragraph } = Typography;

const cardStyle = (borderColor: string): React.CSSProperties => ({
  borderRadius: 8,
  border: `1.5px solid ${borderColor}`,
  boxShadow: `2px 2px 0 0 ${borderColor}`,
});

export const CheckoutPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [recreating, setRecreating] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const fetchOrder = useCallback(async (showSpinner = false) => {
    if (!orderCode) return;
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const res = await getOrderDetailApi(orderCode);
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  }, [orderCode, message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!orderCode) return;
      try {
        const res = await getOrderDetailApi(orderCode);
        if (!ignore && res.success && res.data) {
          setOrder(res.data);
        }
      } catch (error: unknown) {
        if (!ignore) {
          if (isAxiosError(error) && error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error('Failed to load order details');
          }
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
  }, [orderCode, message]);

  const secondsLeft =
    order && order.status === 'pending'
      ? Math.max(
          0,
          Math.floor((new Date(order.expiredAt).getTime() - nowMs) / 1000)
        )
      : 0;

  useEffect(() => {
    if (!order || order.status !== 'pending') {
      return;
    }

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (new Date(order.expiredAt).getTime() <= current) {
        window.clearInterval(timer);
        void fetchOrder();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [order, fetchOrder]);

  useEffect(() => {
    if (!order || order.status !== 'pending' || !orderCode) return;

    const poller = window.setInterval(async () => {
      try {
        const res = await getOrderStatusApi(orderCode);
        if (res.success && res.data) {
          if (res.data.status !== 'pending') {
            window.clearInterval(poller);
            if (res.data.status === 'paid') {
              message.success('Payment successful! Your course is now unlocked.');
            }
            await fetchOrder();
          }
        }
      } catch {
        // Ignore transient network errors while polling
      }
    }, 3000);

    return () => window.clearInterval(poller);
  }, [order, orderCode, fetchOrder, message]);

  const handleCopy = async (value: string | null | undefined, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      message.success(`Copied ${label} to clipboard`);
    } catch {
      message.error('Failed to copy to clipboard');
    }
  };

  const handleSyncPayment = async () => {
    if (!orderCode) return;
    setSyncing(true);
    try {
      const res = await syncOrderWithPayOSApi(orderCode);
      if (res.success && res.data) {
        setOrder(res.data);
        if (res.data.status === 'paid') {
          message.success('Payment verified! Course unlocked.');
        } else if (res.data.status === 'pending') {
          message.info('Transaction not detected yet. Please wait a few seconds and try again.');
        } else {
          message.warning(`Current order status: ${res.data.status.toUpperCase()}`);
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to verify payment with PayOS');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderCode) return;
    setCancelling(true);
    try {
      const res = await cancelPaymentOrderApi(orderCode);
      if (res.success && res.data) {
        setOrder(res.data);
        message.success('Order cancelled');
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to cancel order');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleRecreateOrder = async () => {
    if (!order?.course?.slug && !order?.courseId) return;
    setRecreating(true);
    try {
      const res = await createPaymentOrderApi(
        order.course?.slug || order.courseId
      );
      if (res.success && res.data) {
        navigate(`/checkout/${res.data.orderCode}`, { replace: true });
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to create a new payment order');
      }
    } finally {
      setRecreating(false);
    }
  };

  const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`;

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={13}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Col>
          <Col xs={24} lg={11}>
            <Skeleton active paragraph={{ rows: 10 }} />
          </Col>
        </Row>
      </div>
    );
  }

  if (!order) {
    return (
      <Card style={cardStyle(token.colorBorder)}>
        <Space direction="vertical" size="middle">
          <Title level={4} style={{ margin: 0 }}>
            Order not found
          </Title>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/courses')}
            style={{ borderRadius: 4 }}
          >
            Back to Courses
          </Button>
        </Space>
      </Card>
    );
  }

  const bankInfo = findBankByBin(order.payos.bin);
  const learnUrl = order.course?.slug
    ? order.firstLessonId
      ? `/courses/${order.course.slug}/learn/${order.firstLessonId}`
      : `/courses/${order.course.slug}/learn`
    : '/my-courses';

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <Space size="middle" align="center" wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              navigate(
                order.course?.slug ? `/courses/${order.course.slug}` : '/courses'
              )
            }
            style={{ borderRadius: 4 }}
          >
            Back to Course
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Course Checkout
            </Title>
            <Text type="secondary">
              Order ID: <Text strong>#{order.orderCode}</Text>
            </Text>
          </div>
        </Space>
      </div>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card style={cardStyle(token.colorBorder)}>
              <Space align="start" size="middle" style={{ width: '100%' }}>
                {order.course?.thumbnailUrl ? (
                  <img
                    src={order.course.thumbnailUrl}
                    alt={order.course.title}
                    style={{
                      width: 112,
                      height: 76,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: `1px solid ${token.colorBorder}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 112,
                      height: 76,
                      borderRadius: 6,
                      background: '#f5f5f5',
                      border: `1px solid ${token.colorBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCardOutlined style={{ fontSize: 28, color: '#525252' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Tag
                    style={{
                      borderRadius: 9999,
                      marginBottom: 6,
                      border: `1px solid ${token.colorBorder}`,
                      background: '#f5f5f5',
                      textTransform: 'uppercase',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {order.course?.level || 'Course'}
                  </Tag>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>
                    {order.course?.title || 'Online Course'}
                  </Title>
                  {order.course?.instructor && (
                    <Text type="secondary">
                      Instructor: {order.course.instructor.fullName}
                    </Text>
                  )}
                </div>
              </Space>

              <Divider style={{ margin: '16px 0' }} />

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Payment Method</Text>
                  <Text strong>PayOS · VietQR Instant 24/7</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Course Price</Text>
                  <Text>{formatVnd(order.grossAmount)}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 16 }}>
                    Total Amount
                  </Text>
                  <Title level={3} style={{ margin: 0, color: '#059669' }}>
                    {formatVnd(order.grossAmount)}
                  </Title>
                </div>
              </Space>
            </Card>

            <Card
              title={
                <Space>
                  <QrcodeOutlined />
                  <span>Quick Payment Instructions</span>
                </Space>
              }
              style={cardStyle(token.colorBorder)}
            >
              <Steps
                direction="vertical"
                size="small"
                current={order.status === 'paid' ? 3 : 0}
                items={[
                  {
                    title: 'Open any Vietnamese Banking App or E-Wallet',
                    description:
                      'Supports Vietcombank, MBBank, Techcombank, BIDV, ACB, TPBank, Momo, ZaloPay, and all Napas 24/7 banks.',
                  },
                  {
                    title: 'Scan the VietQR code on the right',
                    description:
                      'The exact amount and transfer description are pre-filled automatically. Do not modify them.',
                  },
                  {
                    title: 'Confirm payment & start learning',
                    description:
                      'Your course access will be unlocked automatically within 2–5 seconds after transfer.',
                  },
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={12}>
          {order.status === 'paid' && (
            <Card style={cardStyle('#059669')}>
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <CheckCircleOutlined
                  style={{ fontSize: 56, color: '#059669', marginBottom: 12 }}
                />
                <Title level={3} style={{ margin: '0 0 8px 0' }}>
                  Payment Successful!
                </Title>
                <Paragraph type="secondary">
                  <Text strong>{order.course?.title}</Text> has been unlocked in your account.
                </Paragraph>

                <div
                  style={{
                    background: '#f9fafb',
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 8,
                    padding: 16,
                    textAlign: 'left',
                    marginBottom: 20,
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Order ID</Text>
                      <Text strong>#{order.orderCode}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Amount Paid</Text>
                      <Text strong>{formatVnd(order.grossAmount)}</Text>
                    </div>
                    {order.payos.reference && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Bank Reference</Text>
                        <Text code>{order.payos.reference}</Text>
                      </div>
                    )}
                    {order.paidAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Paid At</Text>
                        <Text>{new Date(order.paidAt).toLocaleString('en-GB')}</Text>
                      </div>
                    )}
                  </Space>
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate(learnUrl)}
                    style={{
                      backgroundColor: '#a3e635',
                      borderColor: '#262626',
                      color: '#262626',
                      fontWeight: 700,
                      borderRadius: 4,
                      boxShadow: '2px 2px 0 0 #262626',
                    }}
                  >
                    Start Learning Now
                  </Button>
                  <Link to="/my-orders" style={{ display: 'block' }}>
                    <Button block style={{ borderRadius: 4 }}>
                      View Order History
                    </Button>
                  </Link>
                </Space>
              </div>
            </Card>
          )}

          {(order.status === 'expired' || order.status === 'cancelled') && (
            <Card style={cardStyle('#ef4444')}>
              <div style={{ textAlign: 'center', padding: '20px 8px' }}>
                <CloseCircleOutlined
                  style={{ fontSize: 52, color: '#ef4444', marginBottom: 12 }}
                />
                <Title level={3} style={{ margin: '0 0 8px 0' }}>
                  {order.status === 'expired'
                    ? 'Payment Order Expired'
                    : 'Payment Order Cancelled'}
                </Title>
                <Paragraph type="secondary">
                  The VietQR code for order #{order.orderCode} is no longer valid. You can generate a new payment order anytime.
                </Paragraph>

                <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 12 }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<ReloadOutlined />}
                    loading={recreating}
                    onClick={handleRecreateOrder}
                    style={{
                      backgroundColor: '#a3e635',
                      borderColor: '#262626',
                      color: '#262626',
                      fontWeight: 700,
                      borderRadius: 4,
                      boxShadow: '2px 2px 0 0 #262626',
                    }}
                  >
                    Create New Payment Order
                  </Button>
                  <Button
                    block
                    style={{ borderRadius: 4 }}
                    onClick={() => navigate('/my-orders')}
                  >
                    View Order History
                  </Button>
                </Space>
              </div>
            </Card>
          )}

          {order.status === 'pending' && (
            <Card style={cardStyle('#262626')}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <Tag
                  color="warning"
                  icon={<ClockCircleOutlined />}
                  style={{ borderRadius: 9999, padding: '2px 10px', fontWeight: 600 }}
                >
                  Awaiting Payment
                </Tag>
                <Text strong style={{ color: secondsLeft <= 60 ? '#ef4444' : '#262626' }}>
                  Expires in: {formatCountdown(secondsLeft)}
                </Text>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 20,
                  background: '#fcfff7',
                  border: '1.5px solid #262626',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {order.payos.qrCode ? (
                  <div
                    style={{
                      background: '#ffffff',
                      padding: 14,
                      borderRadius: 8,
                      border: '1.5px solid #262626',
                      boxShadow: '2px 2px 0 0 #262626',
                    }}
                  >
                    <QRCodeSVG
                      value={order.payos.qrCode}
                      size={220}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message="QR code unavailable. Please use Open PayOS Page below."
                  />
                )}
                <Space style={{ marginTop: 12 }}>
                  <SafetyCertificateOutlined style={{ color: '#059669' }} />
                  <Text strong>VietQR · Napas 24/7</Text>
                </Space>
              </div>

              <div
                style={{
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                  background: '#ffffff',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Bank</Text>
                    <Text strong>
                      {bankInfo ? `${bankInfo.shortName}` : `BIN ${order.payos.bin || 'N/A'}`}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Account Name</Text>
                    <Text strong>{order.payos.accountName || '-'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Account Number</Text>
                    <Space size="small">
                      <Text strong copyable={false}>
                        {order.payos.accountNumber || '-'}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(order.payos.accountNumber, 'account number')}
                        style={{ borderRadius: 4 }}
                      />
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Amount</Text>
                    <Space size="small">
                      <Text strong style={{ color: '#059669' }}>
                        {formatVnd(order.grossAmount)}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(String(order.grossAmount), 'amount')}
                        style={{ borderRadius: 4 }}
                      />
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Transfer Content</Text>
                    <Space size="small">
                      <Text code strong>
                        {order.payos.description || `KH ${order.orderCode}`}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleCopy(
                            order.payos.description || `KH ${order.orderCode}`,
                            'transfer content'
                          )
                        }
                        style={{ borderRadius: 4 }}
                      />
                    </Space>
                  </div>
                </Space>
              </div>

              <Alert
                type="info"
                showIcon
                icon={<SyncOutlined spin />}
                message="Waiting for automatic payment confirmation..."
                description="This page will update automatically within 2–5 seconds once your transfer succeeds."
                style={{ marginBottom: 16, borderRadius: 6 }}
              />

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SyncOutlined />}
                  loading={syncing}
                  onClick={handleSyncPayment}
                  style={{
                    backgroundColor: '#a3e635',
                    borderColor: '#262626',
                    color: '#262626',
                    fontWeight: 700,
                    borderRadius: 4,
                    boxShadow: '2px 2px 0 0 #262626',
                  }}
                >
                  I Have Transferred · Verify Now
                </Button>

                <Row gutter={12}>
                  {order.payos.checkoutUrl && (
                    <Col span={12}>
                      <Button
                        block
                        icon={<ExportOutlined />}
                        href={order.payos.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ borderRadius: 4 }}
                      >
                        Open PayOS Page
                      </Button>
                    </Col>
                  )}
                  <Col span={order.payos.checkoutUrl ? 12 : 24}>
                    <Popconfirm
                      title="Cancel this order?"
                      description="The current VietQR code will be invalidated."
                      onConfirm={handleCancelOrder}
                      okText="Cancel Order"
                      cancelText="Keep"
                    >
                      <Button
                        danger
                        block
                        loading={cancelling}
                        style={{ borderRadius: 4 }}
                      >
                        Cancel Order
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};
