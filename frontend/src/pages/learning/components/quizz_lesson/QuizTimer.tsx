import React from 'react';
import { Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { QuizTimerProps } from './types';

const { Text } = Typography;

export const QuizTimer: React.FC<QuizTimerProps> = ({ remainingSeconds, formatTime }) => {
  if (remainingSeconds === null) return null;

  const isUrgent = remainingSeconds < 120;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 9999,
        backgroundColor: isUrgent ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${isUrgent ? '#fecaca' : '#bbf7d0'}`,
      }}
    >
      <ClockCircleOutlined
        style={{
          color: isUrgent ? '#dc2626' : '#166534',
          fontSize: 16,
        }}
      />
      <Text
        strong
        style={{
          fontSize: 16,
          fontFamily: 'monospace',
          color: isUrgent ? '#dc2626' : '#166534',
        }}
      >
        {formatTime(remainingSeconds)}
      </Text>
    </div>
  );
};
