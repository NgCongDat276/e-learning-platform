import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Typography, Tag, Button, theme } from 'antd';
import { SolutionOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/useAuth';

const { Title, Paragraph, Text } = Typography;

export const TeachWithUsSection: React.FC = () => {
  const { token } = theme.useToken();
  const { isAuthenticated } = useAuth();

  return (
    <section id="teach-with-us" style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
      <div
        style={{
          backgroundColor: '#262626',
          color: '#fcfff7',
          borderRadius: token.borderRadiusLG,
          padding: '56px 48px',
          border: '2px solid #262626',
          boxShadow: '4px 4px 0 0 #a3e635',
        }}
      >
        <Row gutter={[48, 36]} align="middle">
          <Col xs={24} lg={14}>
            <Tag
              style={{
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 11,
                backgroundColor: token.colorPrimary,
                color: '#262626',
                border: 'none',
                marginBottom: 16,
                textTransform: 'uppercase',
              }}
            >
              Instructor Partnership Program
            </Tag>
            <Title
              level={2}
              style={{
                color: '#fcfff7',
                fontSize: 'clamp(28px, 4vw, 40px)',
                letterSpacing: -1,
                margin: '0 0 16px 0',
              }}
            >
              Are You a Senior Engineer or Educator?{' '}
              <span className="font-editorial" style={{ fontStyle: 'italic', color: token.colorPrimary }}>
                Share Your Craft.
              </span>
            </Title>
            <Paragraph style={{ color: '#d4d4d4', fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
              We maintain the highest pedagogical standard in engineering education. Apply to become an instructor,
              get your credentials reviewed by our team, and gain access to our unified course authoring studio and video pipelines.
            </Paragraph>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to={isAuthenticated ? '/profile' : '/register'}>
                <Button
                  type="primary"
                  size="large"
                  icon={<SolutionOutlined />}
                  style={{
                    height: 46,
                    padding: '0 28px',
                    fontWeight: 600,
                    backgroundColor: token.colorPrimary,
                    borderColor: token.colorPrimary,
                    color: '#262626',
                    boxShadow: '2px 2px 0 0 #ffffff',
                  }}
                >
                  Apply to Teach on Edutech
                </Button>
              </Link>
              <a href="#faq">
                <Button
                  size="large"
                  style={{
                    height: 46,
                    padding: '0 24px',
                    backgroundColor: 'transparent',
                    borderColor: '#737373',
                    color: '#ffffff',
                    fontWeight: 500,
                  }}
                >
                  Review Guidelines
                </Button>
              </a>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <div
              style={{
                backgroundColor: '#303030',
                borderRadius: token.borderRadiusLG,
                padding: '28px',
                border: '1px solid #404040',
              }}
            >
              <Title level={4} style={{ color: '#ffffff', fontSize: 16, marginBottom: 20 }}>
                Three-Step Educator Onboarding
              </Title>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: token.colorPrimary,
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <Text strong style={{ color: '#ffffff', fontSize: 14, display: 'block' }}>
                      Register & Submit Portfolio
                    </Text>
                    <Text style={{ color: '#a3a3a3', fontSize: 13 }}>
                      Select Lecturer at signup and provide your degree, industry CV, and expertise domain.
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: token.colorPrimary,
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <Text strong style={{ color: '#ffffff', fontSize: 14, display: 'block' }}>
                      Admin Verification & Review
                    </Text>
                    <Text style={{ color: '#a3a3a3', fontSize: 13 }}>
                      Our administration team audits candidate credentials to guarantee authentic industry depth.
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: token.colorPrimary,
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <Text strong style={{ color: '#ffffff', fontSize: 14, display: 'block' }}>
                      Publish & Earn Revenue
                    </Text>
                    <Text style={{ color: '#a3a3a3', fontSize: 13 }}>
                      Access the Instructor Studio, draft courses, organize video chapters, and mentor students.
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};
