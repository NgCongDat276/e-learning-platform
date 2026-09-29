import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Typography, Space, theme, Row, Col } from 'antd';
import { BookOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const AuthLayout: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: token.colorBgLayout, // #fcfff7 Cream
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          borderBottom: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorBgContainer, // #ffffff
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Space size="small" align="center">
            <BookOutlined style={{ fontSize: 22, color: token.colorText }} />
            <Text strong style={{ fontSize: 17, letterSpacing: -0.5, color: token.colorText }}>
              EDUTECH{' '}
              <span
                style={{
                  color: token.colorPrimary,
                  background: token.colorText,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                LMS
              </span>
            </Text>
          </Space>
        </Link>

        <Link
          to="/"
          style={{
            color: token.colorTextSecondary,
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          <ArrowLeftOutlined /> Back to Home
        </Link>
      </header>

      {/* Main Body: Editorial Split-Screen Layout */}
      <div
        style={{
          flex: 1,
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Row gutter={[48, 32]} align="middle" style={{ width: '100%' }} justify={'center'}>
          {/* Left Column: Editorial Showcase (Visible on Large Screens) */}
        

          {/* Right Column: Dynamic Auth Form Container */}
          <Col xs={24} lg={13} xl={14}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '12px 0',
              }}
            >
              <Outlet />
            </div>
          </Col>
        </Row>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          padding: '20px 24px',
          textAlign: 'center',
          backgroundColor: token.colorBgContainer,
        }}
      >
        <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
          EDUTECH LMS © 2026. Editorial Broadsheet Design System & Ant Design Tokens.
        </Text>
      </footer>
    </div>
  );
};
