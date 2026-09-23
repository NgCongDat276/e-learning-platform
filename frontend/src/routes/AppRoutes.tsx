import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Button, Card, Typography, Space, Tag, Progress, Row, Col, theme } from 'antd';
import {
  RocketOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  ClockCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

const { Title, Paragraph, Text } = Typography;

// 1. Trang chủ chuẩn phong cách Editorial & Lime Sprint
const HomePage: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      {/* Top Bar / Navigation Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 24,
          marginBottom: 48,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Space size="middle" align="center">
          <BookOutlined style={{ fontSize: 24, color: token.colorText }} />
          <Text strong style={{ fontSize: 18, letterSpacing: -0.5 }}>
            EDUTECH <span style={{ color: token.colorPrimary, background: token.colorText, padding: '2px 6px', borderRadius: 4 }}>LMS</span>
          </Text>
          <Tag
            style={{
              backgroundColor: '#dcfff1',
              borderColor: '#7ee2b8',
              color: '#262626',
              borderRadius: 9999,
              marginLeft: 8,
              fontWeight: 500,
            }}
          >
            ● Trạng thái: Sẵn sàng
          </Tag>
        </Space>

        <Space size="small">
          <Link to="/login">
            <Button type="primary" size="middle">
              Đăng nhập
            </Button>
          </Link>
          <Link to="/register">
            <Button icon={<UserAddOutlined />} size="middle">
              Đăng ký
            </Button>
          </Link>
        </Space>
      </div>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 64px auto' }}>
        <Title level={1} style={{ fontSize: 48, lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
          Hệ thống đào tạo{' '}
          <span className="font-editorial" style={{ color: token.colorText }}>
            thực chiến
          </span>{' '}
          và tinh gọn
        </Title>
        <Paragraph style={{ fontSize: 18, color: token.colorTextSecondary, maxWidth: 640, margin: '0 auto 28px' }}>
          Giao diện chuẩn hóa theo triết lý Editorial Broadsheet: nền giấy êm mắt, cấu trúc rõ ràng,
          giúp bạn tập trung 100% vào việc tiếp thu tri thức.
        </Paragraph>
        <Space size="middle">
          <Link to="/courses">
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              style={{ padding: '0 28px', height: 46 }}
            >
              Bắt đầu học ngay
            </Button>
          </Link>
          <Button size="large" style={{ padding: '0 24px', height: 46 }}>
            Khám phá giáo trình
          </Button>
        </Space>
      </div>

      {/* Feature Showcase Grid (Course Card & Progress Demo) */}
      <Row gutter={[24, 24]} style={{ marginBottom: 64 }}>
        {/* Course Card 1 */}
        <Col xs={24} md={12} lg={8}>
          <Card
            className="card-hard-shadow"
            styles={{ body: { padding: 24 } }}
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tag
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${token.colorText}`,
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                FULLSTACK DEV
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <ClockCircleOutlined /> 32 giờ học
              </Text>
            </div>

            <Title level={4} style={{ marginBottom: 8, marginTop: 4 }}>
              Xây dựng Hệ thống E-Learning với React 19 & NestJS
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 14, minHeight: 42 }}>
              Kiến trúc Microservices, xác thực JWT RBAC và thanh toán bảo mật.
            </Paragraph>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <Text type="secondary">Tiến độ bài học</Text>
                <Text strong>68%</Text>
              </div>
              <Progress percent={68} showInfo={false} strokeColor={token.colorPrimary} />
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <CheckCircleFilled style={{ color: token.colorSuccess }} />
                <Text style={{ fontSize: 13 }}>14/20 bài đã xong</Text>
              </Space>
              <Button type="primary" icon={<PlayCircleOutlined />}>
                Vào học
              </Button>
            </div>
          </Card>
        </Col>

        {/* Course Card 2 */}
        <Col xs={24} md={12} lg={8}>
          <Card
            className="card-hard-shadow"
            styles={{ body: { padding: 24 } }}
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tag
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${token.colorText}`,
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                UI / UX DESIGN
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <ClockCircleOutlined /> 18 giờ học
              </Text>
            </div>

            <Title level={4} style={{ marginBottom: 8, marginTop: 4 }}>
              Design Systems & Design Tokens chuyên sâu
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 14, minHeight: 42 }}>
              Nguyên lý thiết kế Editorial, chuẩn hóa Figma tokens và tích hợp Ant Design.
            </Paragraph>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <Text type="secondary">Tiến độ bài học</Text>
                <Text strong>100%</Text>
              </div>
              <Progress percent={100} showInfo={false} strokeColor={token.colorSuccess} />
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="success" style={{ borderRadius: 9999 }}>Đã nhận chứng chỉ</Tag>
              <Button>Xem lại</Button>
            </div>
          </Card>
        </Col>

        {/* Stat & Streak Card */}
        <Col xs={24} md={24} lg={8}>
          <Card
            styles={{ body: { padding: 24 } }}
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Space align="center" style={{ marginBottom: 16 }}>
                <ThunderboltFilled style={{ fontSize: 28, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0 }}>
                  Chuỗi Học Tập (Streak)
                </Title>
              </Space>
              <Title level={2} style={{ fontSize: 44, margin: '12px 0 4px', letterSpacing: -1 }}>
                12 <span style={{ fontSize: 18, fontWeight: 400, color: token.colorTextSecondary }}>ngày liên tiếp</span>
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14 }}>
                Duy trì việc học ít nhất 1 bài mỗi ngày để giữ vững chuỗi phong độ của bạn!
              </Paragraph>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: token.colorBgLayout,
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorder}`,
                marginTop: 16,
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Mục tiêu tuần này
              </Text>
              <Progress percent={85} strokeColor={token.colorPrimary} size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã hoàn thành 5/6 bài tập được giao.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          paddingTop: 32,
          textAlign: 'center',
          color: token.colorTextSecondary,
          fontSize: 14,
        }}
      >
        <Text type="secondary">
          Graduation Thesis — E-Learning Management System (LMS) © 2026. Designed with Ant Design & Editorial Tokens.
        </Text>
      </div>
    </div>
  );
};

// 2. Trang 404
const NotFoundPage: React.FC = () => (
  <div style={{ padding: '80px 24px', textAlign: 'center' }}>
    <Title level={2}>404 — Không tìm thấy trang</Title>
    <Paragraph type="secondary">Trang bạn truy cập hiện không tồn tại hoặc đã được di chuyển.</Paragraph>
    <Link to="/">
      <Button type="primary">Quay về Trang chủ</Button>
    </Link>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Auth routes bọc trong AuthLayout Split-screen */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
