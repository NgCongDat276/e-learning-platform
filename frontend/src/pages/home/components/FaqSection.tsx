import React from 'react';
import { Collapse, Typography, Tag, theme } from 'antd';
import { FAQ_DATA } from '../data/home.data';

const { Title, Paragraph, Text } = Typography;

export const FaqSection: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <section id="faq" style={{ maxWidth: 840, margin: '0 auto 96px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
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
          Clear Inquiries
        </Tag>
        <Title level={2} style={{ fontSize: 32, letterSpacing: -0.8, margin: 0 }}>
          Frequently Asked Questions
        </Title>
      </div>

      <Collapse
        accordion
        bordered
        style={{
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorder,
          borderRadius: token.borderRadiusLG,
          boxShadow: 'var(--shadow-hard)',
        }}
        items={FAQ_DATA.map((item) => ({
          key: item.key,
          label: (
            <Text strong style={{ fontSize: 15 }}>
              {item.question}
            </Text>
          ),
          children: (
            <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {item.answer}
            </Paragraph>
          ),
        }))}
      />
    </section>
  );
};
