import React from 'react';
import { Typography, theme } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const QuizNotConfigured: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-hard)',
        marginBottom: 24,
      }}
    >
      <QuestionCircleOutlined
        style={{
          fontSize: 44,
          color: '#f59e0b',
          marginBottom: 16,
        }}
      />
      <Title level={3} style={{ margin: '0 0 10px 0', fontSize: 22 }}>
        Assessment Pending Configuration
      </Title>
      <Paragraph
        type="secondary"
        style={{ maxWidth: 560, margin: '0 auto', fontSize: 14, lineHeight: 1.6 }}
      >
        The lecturer has not configured question rules or added question banks for this quiz
        lesson yet. Please check back later or proceed with the curriculum walkthrough.
      </Paragraph>
    </div>
  );
};
