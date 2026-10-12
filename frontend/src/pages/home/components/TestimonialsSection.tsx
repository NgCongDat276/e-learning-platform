import React from 'react';
import { Card, Typography, Tag, Row, Col, theme } from 'antd';
import { TESTIMONIALS_DATA } from '../data/home.data';

const { Title, Paragraph, Text } = Typography;

export const TestimonialsSection: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
        <Tag
          style={{
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 11,
            textTransform: 'uppercase',
            backgroundColor: token.colorBgLayout,
            borderColor: token.colorBorder,
            marginBottom: 8,
          }}
        >
          Editorial Reviews
        </Tag>
        <Title level={2} style={{ fontSize: 32, letterSpacing: -0.8, margin: 0 }}>
          Praised by Practicing Engineers
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {TESTIMONIALS_DATA.map((item, index) => (
          <Col xs={24} md={8} key={index}>
            <Card
              className="card-hard-shadow"
              style={{
                backgroundColor: token.colorBgContainer,
                borderColor: token.colorBorder,
                borderRadius: token.borderRadiusLG,
                height: '100%',
              }}
              styles={{
                body: {
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                },
              }}
            >
              <div>
                <div style={{ color: token.colorPrimary, fontSize: 32, lineHeight: 1, marginBottom: 12 }}>
                  “
                </div>
                <Paragraph style={{ fontSize: 14, lineHeight: 1.65, color: token.colorText, marginBottom: 20 }}>
                  {item.quote}
                </Paragraph>
              </div>
              <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 14 }}>
                <Text strong style={{ fontSize: 14, display: 'block' }}>
                  {item.author}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.role} · {item.company}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
};
