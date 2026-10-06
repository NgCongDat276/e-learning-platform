import React from 'react';
import { Row, Col, Typography, theme } from 'antd';

const { Title, Text } = Typography;

interface MetricsRibbonProps {
  totalCourses?: number;
  totalChapters?: number;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({
  totalCourses,
  totalChapters,
}) => {
  const { token } = theme.useToken();

  const coursesDisplay = totalCourses && totalCourses > 0 ? `${totalCourses}+` : '24+';
  const chaptersDisplay = totalChapters && totalChapters > 0 ? `${totalChapters}+` : '120+';

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto 64px', padding: '0 24px' }}>
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadiusLG,
          boxShadow: 'var(--shadow-hard)',
          padding: '28px 32px',
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
              <Title level={2} style={{ margin: 0, fontSize: 36, letterSpacing: -1 }}>
                {coursesDisplay}
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Live Production Curricula
              </Text>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
              <Title level={2} style={{ margin: 0, fontSize: 36, letterSpacing: -1 }}>
                {chaptersDisplay}
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Structured Learning Chapters
              </Text>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
              <Title level={2} style={{ margin: 0, fontSize: 36, letterSpacing: -1, color: token.colorSuccess }}>
                98.4%
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Chapter Assessment Pass Rate
              </Text>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, fontSize: 36, letterSpacing: -1 }}>
                100%
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Vetted & Verified Instructors
              </Text>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};
