import React from 'react';
import { Row, Col, Typography, Tag, theme } from 'antd';

const { Title, Paragraph, Text } = Typography;

export const MethodologySection: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <section
      id="methodology"
      style={{
        backgroundColor: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorder}`,
        borderBottom: `1px solid ${token.colorBorder}`,
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <Tag
            style={{
              borderRadius: 9999,
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase',
              backgroundColor: '#dcfff1',
              borderColor: '#7ee2b8',
              color: '#262626',
              marginBottom: 8,
            }}
          >
            Pedagogical Framework
          </Tag>
          <Title level={2} style={{ fontSize: 36, letterSpacing: -1, margin: '6px 0 12px 0' }}>
            The Edutech Broadsheet Standard
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Three engineering principles engineered to take software practitioners from passive observers to autonomous builders.
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <div
              style={{
                padding: '32px 28px',
                backgroundColor: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: token.colorTextSecondary,
                  lineHeight: 1,
                  marginBottom: 16,
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                }}
              >
                01
              </div>
              <Title level={4} style={{ fontSize: 20, marginBottom: 12, letterSpacing: -0.4 }}>
                Vertical-Slice Architecture
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                We don't teach isolated syntax or artificial toy snippets. Every course builds complete end-to-end applications:
                database schemas, JWT authentication, backend controllers, client caching, and cloud asset processing.
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                padding: '32px 28px',
                backgroundColor: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: token.colorPrimary,
                  lineHeight: 1,
                  marginBottom: 16,
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                }}
              >
                02
              </div>
              <Title level={4} style={{ fontSize: 20, marginBottom: 12, letterSpacing: -0.4 }}>
                Precision Diagnostic Quizzes
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Passive video watching creates the illusion of mastery. Our chapter-level automated quizzes test your conceptual
                decision-making with immediate explanation rationales and diagnostic benchmarks.
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                padding: '32px 28px',
                backgroundColor: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: token.colorTextSecondary,
                  lineHeight: 1,
                  marginBottom: 16,
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                }}
              >
                03
              </div>
              <Title level={4} style={{ fontSize: 20, marginBottom: 12, letterSpacing: -0.4 }}>
                Vetted Educator Credentials
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Anyone can record a video, but only verified practitioners teach on Edutech. Every instructor application
                undergoes thorough administrator evaluation of degrees, portfolio projects, and technical depth.
              </Paragraph>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};
