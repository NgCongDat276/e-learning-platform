import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Progress,
  Row,
  Col,
  theme,
  Dropdown,
  Avatar,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  RocketOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  ClockCircleOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/useAuth';

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const { token } = theme.useToken();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block', color: token.colorText }}>
            {user?.full_name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">My Profile</Link>,
    },
    {
      key: 'courses',
      icon: <DashboardOutlined />,
      label: (
        <Link to={user?.role === 'lecturer' ? '/teacher/courses' : '/courses'}>
          {user?.role === 'lecturer' ? 'Teaching Workspace' : 'My Courses'}
        </Link>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      {/* Top Bar / Navigation Header */}
      <header
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
            EDUTECH{' '}
            <span
              style={{
                color: token.colorPrimary,
                background: token.colorText,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              LMS
            </span>
          </Text>
          {/* <Tag
            style={{
              backgroundColor: '#dcfff1',
              borderColor: '#7ee2b8',
              color: '#262626',
              borderRadius: 9999,
              marginLeft: 8,
              fontWeight: 500,
            }}
          >
            ● Status: Live
          </Tag> */}
        </Space>

        {isAuthenticated && user ? (
          <Space size="middle" align="center">
            <Tag
              style={{
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: 11,
                borderRadius: 9999,
                backgroundColor: token.colorBgLayout,
                borderColor: token.colorBorder,
              }}
            >
              {user.role}
            </Tag>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorBorder}`,
                  backgroundColor: token.colorBgContainer,
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: token.colorPrimary,
                    color: token.colorText,
                    fontWeight: 700,
                  }}
                  size="small"
                >
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Text strong style={{ fontSize: 14 }}>
                  {user.full_name}
                </Text>
              </div>
            </Dropdown>
          </Space>
        ) : (
          <Space size="small">
            <Link to="/login">
              <Button type="primary" size="middle">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button icon={<UserAddOutlined />} size="middle">
                Sign Up
              </Button>
            </Link>
          </Space>
        )}
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 64px auto' }}>
        <Title level={1} style={{ fontSize: 48, lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
          A Practical & Focused{' '}
          <span className="font-editorial" style={{ color: token.colorText }}>
            Learning Platform
          </span>
        </Title>
        <Paragraph style={{ fontSize: 18, color: token.colorTextSecondary, maxWidth: 660, margin: '0 auto 28px' }}>
          Crafted with Editorial Broadsheet principles: clear layout, typography-first hierarchy,
          and high-impact curricula to keep you 100% focused on mastering skills.
        </Paragraph>
        <Space size="middle">
          <Link to={isAuthenticated ? '/courses' : '/register'}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              style={{ padding: '0 28px', height: 46 }}
            >
              {isAuthenticated ? 'Browse Courses' : 'Get Started Free'}
            </Button>
          </Link>
          <Link to="/courses">
            <Button size="large" style={{ padding: '0 24px', height: 46 }}>
              Explore Curriculum
            </Button>
          </Link>
        </Space>
      </section>

      {/* Feature Showcase Grid (Course Card & Progress Demo) */}
      <Row gutter={[24, 24]} style={{ marginBottom: 64 }}>
        {/* Course Card 1 */}
        <Col xs={24} md={12} lg={8}>
          <Card
            hoverable
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Tag color="lime" style={{ color: '#262626', fontWeight: 600, borderRadius: 9999 }}>
                  FULLSTACK
                </Tag>
                <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                  <ClockCircleOutlined /> 32 hours
                </Space>
              </div>

              <Title level={3} style={{ fontSize: 20, margin: '0 0 10px 0' }}>
                Modern Web Architecture: Node.js & React 19
              </Title>

              <Paragraph type="secondary" style={{ fontSize: 14 }}>
                Master modular vertical-slice design, PostgreSQL with Prisma, JWT security, and Ant Design 6.
              </Paragraph>
            </div>

            <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 18 }}>$49</Text>
                  <Text delete type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>$99</Text>
                </div>
                <Button type="primary" icon={<PlayCircleOutlined />}>
                  Enroll Now
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Course Card 2 */}
        <Col xs={24} md={12} lg={8}>
          <Card
            hoverable
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Tag style={{ borderRadius: 9999, backgroundColor: '#dcfff1', borderColor: '#7ee2b8', color: '#262626' }}>
                  DEV OPS
                </Tag>
                <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                  <ClockCircleOutlined /> 18 hours
                </Space>
              </div>

              <Title level={3} style={{ fontSize: 20, margin: '0 0 10px 0' }}>
                Cloudflare R2 & AWS S3 Media Pipelines
              </Title>

              <Paragraph type="secondary" style={{ fontSize: 14 }}>
                Direct presigned upload architecture, video stream processing, and multi-tier access control.
              </Paragraph>
            </div>

            <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={6}>
                  <CheckCircleFilled style={{ color: token.colorSuccess }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>Certificate Included</Text>
                </Space>
                <Button>Learn More</Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Streak & Motivation Card */}
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
                  Learning Streak
                </Title>
              </Space>
              <Title level={2} style={{ fontSize: 44, margin: '12px 0 4px', letterSpacing: -1 }}>
                12 <span style={{ fontSize: 18, fontWeight: 400, color: token.colorTextSecondary }}>days in a row</span>
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14 }}>
                Keep your momentum! Complete at least one lesson daily to maintain your learning streak.
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
                Weekly Target
              </Text>
              <Progress percent={85} strokeColor={token.colorPrimary} size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                5 of 6 assigned lessons completed this week.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          paddingTop: 32,
          textAlign: 'center',
          color: token.colorTextSecondary,
          fontSize: 14,
        }}
      >
        <Text type="secondary">
          EDUTECH LMS © 2026. Built with Editorial Broadsheet Design System & Ant Design Tokens.
        </Text>
      </footer>
    </div>
  );
};
