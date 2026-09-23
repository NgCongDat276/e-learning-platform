import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Typography, Space, Tag, theme, Row, Col } from 'antd';
import {
  BookOutlined,
  ThunderboltFilled,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

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
          <ArrowLeftOutlined /> Quay về Trang chủ
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
        <Row gutter={[48, 32]} align="middle" style={{ width: '100%' }}>
          {/* Left Column: Editorial Showcase (Visible on Large Screens) */}
          <Col xs={0} lg={11} xl={10}>
            <div style={{ paddingRight: 16 }}>
              <Tag
                style={{
                  backgroundColor: '#dcfff1',
                  borderColor: '#7ee2b8',
                  color: '#262626',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '4px 12px',
                  marginBottom: 20,
                }}
              >
                ● HỆ THỐNG ĐÀO TẠO THỰC CHIẾN
              </Tag>

              <Title
                level={1}
                style={{
                  fontSize: 38,
                  lineHeight: 1.2,
                  letterSpacing: -1,
                  marginBottom: 16,
                  color: token.colorText,
                }}
              >
                Nơi tri thức biến thành{' '}
                <span className="font-editorial" style={{ color: token.colorText }}>
                  năng lực
                </span>{' '}
                và bứt phá.
              </Title>

              <Paragraph
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: token.colorTextSecondary,
                  marginBottom: 32,
                }}
              >
                Trải nghiệm học tập và giảng dạy theo phong cách Editorial Broadsheet: trang nhã,
                tập trung cao độ và không phân tâm.
              </Paragraph>

              {/* Feature Highlights */}
              <Space orientation="vertical" size="middle" style={{ width: '100%', marginBottom: 32 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                    backgroundColor: token.colorBgContainer,
                  }}
                >
                  <ThunderboltFilled style={{ fontSize: 20, color: token.colorPrimary, marginTop: 2 }} />
                  <div>
                    <Text strong style={{ fontSize: 14, display: 'block', color: token.colorText }}>
                      Lộ trình bài giảng tinh gọn
                    </Text>
                    <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                      Video chất lượng cao, bài kiểm tra trắc nghiệm tức thì và theo dõi tiến độ chuẩn xác.
                    </Text>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                    backgroundColor: token.colorBgContainer,
                  }}
                >
                  <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorSuccess, marginTop: 2 }} />
                  <div>
                    <Text strong style={{ fontSize: 14, display: 'block', color: token.colorText }}>
                      Hồ sơ Giảng viên chuyên nghiệp
                    </Text>
                    <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                      Không gian độc quyền để các chuyên gia xuất bản khóa học, quản lý học viên và ngân hàng câu hỏi.
                    </Text>
                  </div>
                </div>
              </Space>

              {/* Editorial Quote Card */}
              <div
                style={{
                  borderLeft: `4px solid ${token.colorPrimary}`,
                  backgroundColor: '#ffffff',
                  padding: '16px 20px',
                  borderRadius: '0 8px 8px 0',
                  border: `1px solid ${token.colorBorder}`,
                  borderLeftWidth: 4,
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                <Text italic style={{ fontSize: 14, color: token.colorText, display: 'block' }}>
                  “Đầu tư vào tri thức luôn mang lại mức lợi nhuận cao nhất cho tương lai của bạn.”
                </Text>
                <Text style={{ fontSize: 12, color: token.colorTextSecondary, display: 'block', marginTop: 4 }}>
                  — Benjamin Franklin
                </Text>
              </div>
            </div>
          </Col>

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
          EDUTECH LMS © 2026. Chuẩn phong cách thiết kế Editorial Broadsheet & Ant Design Tokens.
        </Text>
      </footer>
    </div>
  );
};
