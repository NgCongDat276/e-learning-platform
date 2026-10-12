import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Typography, Space, theme } from 'antd';
import { BookOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export const HomeFooter: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <footer
      style={{
        borderTop: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer,
        padding: '64px 24px 36px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[48, 36]}>
          <Col xs={24} md={8}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: token.colorText,
                  borderRadius: token.borderRadius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOutlined style={{ color: token.colorPrimary, fontSize: 15 }} />
              </div>
              <Text strong style={{ fontSize: 18, letterSpacing: -0.5 }}>
                EDUTECH LMS
              </Text>
            </div>
            <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 320 }}>
              The editorial broadsheet learning platform crafted for serious engineering practitioners.
              Built with precision typography, strict design tokens, and production depth.
            </Paragraph>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: token.colorSuccess,
                  display: 'inline-block',
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                All platform systems operational (Spring 2026)
              </Text>
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <Text
              strong
              style={{
                display: 'block',
                fontSize: 14,
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Curricula
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <a href="#curricula" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Web Architecture
              </a>
              <a href="#curricula" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Cloud & Infrastructure
              </a>
              <a href="#curricula" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Algorithms & CS
              </a>
              <a href="#curricula" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Security & Audit
              </a>
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <Text
              strong
              style={{
                display: 'block',
                fontSize: 14,
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Platform
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <a href="#methodology" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Methodology
              </a>
              <a href="#interactive-demo" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Interactive Simulator
              </a>
              <a href="#faq" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Frequently Asked Questions
              </a>
              <Link to="/profile" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Account Settings
              </Link>
            </div>
          </Col>

          <Col xs={24} sm={8} md={6}>
            <Text
              strong
              style={{
                display: 'block',
                fontSize: 14,
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Instructors
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <a href="#teach-with-us" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Apply to Teach
              </a>
              <a href="#teach-with-us" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Pedagogical Standards
              </a>
              <Link to="/teacher/courses" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Instructor Studio
              </Link>
              <Link to="/admin/users" style={{ color: token.colorTextSecondary, textDecoration: 'none' }}>
                Governance Portal
              </Link>
            </div>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${token.colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            EDUTECH LMS © 2026. Built with Lime-Marker Editorial Broadsheet Design System & Ant Design Tokens.
          </Text>
          <Space size="middle" style={{ fontSize: 12 }}>
            <span style={{ color: token.colorTextSecondary }}>English (US)</span>
            <span style={{ color: token.colorTextSecondary }}>Privacy Policy</span>
            <span style={{ color: token.colorTextSecondary }}>Terms of Service</span>
          </Space>
        </div>
      </div>
    </footer>
  );
};
