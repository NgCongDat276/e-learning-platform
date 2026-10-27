import React from 'react';
import { Typography, theme } from 'antd';
import type { QuizQuestionGridProps } from './types';

const { Text } = Typography;

export const QuizQuestionGrid: React.FC<QuizQuestionGridProps> = ({
  totalQuestions,
  questionIds,
  currentQuestionIndex,
  selectedAnswers,
  onSelectQuestion,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        padding: '20px 24px',
        boxShadow: 'var(--shadow-hard)',
      }}
    >
      <Text
        strong
        style={{
          fontSize: 13,
          textTransform: 'uppercase',
          color: token.colorTextSecondary,
          display: 'block',
          marginBottom: 12,
        }}
      >
        Question Navigation Grid
      </Text>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {questionIds.map((qid, idx) => {
          const hasAnswered = selectedAnswers[qid] && selectedAnswers[qid].length > 0;
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={qid}
              onClick={() => onSelectQuestion(idx)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 4,
                border: `1px solid ${isCurrent ? '#262626' : hasAnswered ? '#a3e635' : token.colorBorder}`,
                backgroundColor: isCurrent
                  ? '#262626'
                  : hasAnswered
                    ? '#ecfccb'
                    : token.colorBgContainer,
                color: isCurrent ? '#ffffff' : hasAnswered ? '#3f6212' : token.colorText,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: isCurrent ? '1px 1px 0px 0px #000' : 'none',
                transition: 'all 0.1s ease',
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
