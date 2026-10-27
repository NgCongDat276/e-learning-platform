import React from 'react';
import { Spin, Typography, theme } from 'antd';

const { Paragraph } = Typography;

export const QuizLoading: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        backgroundColor: token.colorBgContainer,
        borderRadius: 8,
        border: `1px solid ${token.colorBorder}`,
      }}
    >
      <Spin size="large" />
      <Paragraph type="secondary" style={{ marginTop: 16 }}>
        Loading assessment diagnostic suite...
      </Paragraph>
    </div>
  );
};
