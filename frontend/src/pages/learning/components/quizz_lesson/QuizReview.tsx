import React from 'react';
import { Typography, Button, Tag, Space, theme } from 'antd';
import {
  TrophyOutlined,
  CloseCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import type { QuizReviewProps } from './types';

const { Title, Text, Paragraph } = Typography;

export const QuizReview: React.FC<QuizReviewProps> = ({
  reviewData,
  studentSummary,
  onBackToOverview,
  onStartAttempt,
}) => {
  const { token } = theme.useToken();
  const isPassed = reviewData.is_passed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Result Header Hero Card */}
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 8,
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: isPassed ? '#dcfce7' : '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: `2px solid ${isPassed ? '#86efac' : '#fca5a5'}`,
          }}
        >
          {isPassed ? (
            <TrophyOutlined style={{ fontSize: 32, color: '#16a34a' }} />
          ) : (
            <CloseCircleFilled style={{ fontSize: 32, color: '#dc2626' }} />
          )}
        </div>

        <Title level={2} style={{ margin: '0 0 6px 0', fontSize: 26 }}>
          {isPassed ? 'Assessment Mastered!' : 'Benchmark Not Met'}
        </Title>

        <Paragraph
          type="secondary"
          style={{ maxWidth: 520, margin: '0 auto 24px auto', fontSize: 15 }}
        >
          {isPassed
            ? 'Excellent conceptual execution! Your completion status has been updated across the curriculum.'
            : 'Review your incorrect questions below, study the walkthrough notes, and retake the test when ready.'}
        </Paragraph>

        {/* Large Score Metric */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 8,
            padding: '12px 28px',
            borderRadius: 8,
            backgroundColor: isPassed ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${isPassed ? '#bbf7d0' : '#fecdd3'}`,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: isPassed ? '#166534' : '#991b1b',
              lineHeight: 1,
            }}
          >
            {reviewData.score}%
          </Text>
          <Text type="secondary" style={{ fontSize: 15 }}>
            (Passing Benchmark: {reviewData.passing_score}%)
          </Text>
        </div>

        <div>
          <Space size="middle">
            <Button
              size="large"
              onClick={() => void onBackToOverview()}
              style={{ borderRadius: 4, fontWeight: 600 }}
            >
              Back to Assessment Hub
            </Button>

            {studentSummary?.can_attempt && (
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={() => void onStartAttempt()}
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: token.colorPrimary,
                  color: '#262626',
                  borderColor: '#262626',
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                Retake Assessment
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Question-by-Question Review Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Title level={4} style={{ margin: '8px 0', fontSize: 18 }}>
          Question Breakdown & Detailed Analysis
        </Title>

        {reviewData.questions.map((q, qIndex) => {
          const isCorrect = q.is_correct;

          return (
            <div
              key={q.id}
              style={{
                backgroundColor: token.colorBgContainer,
                border: `1px solid ${isCorrect ? '#86efac' : '#fca5a5'}`,
                borderLeft: `6px solid ${isCorrect ? '#16a34a' : '#dc2626'}`,
                borderRadius: 8,
                padding: '24px 28px',
                boxShadow: '1px 1px 0px 0px #262626',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Space size="small">
                  <Text strong style={{ fontSize: 15 }}>
                    Question {qIndex + 1}
                  </Text>
                  <Tag
                    color={isCorrect ? 'success' : 'error'}
                    style={{ borderRadius: 9999, fontWeight: 700 }}
                  >
                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </Tag>
                </Space>

                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                  Earned: {q.points_earned} / {q.points} pt
                </Text>
              </div>

              <Paragraph style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>
                {q.content}
              </Paragraph>

              {/* Options Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt) => {
                  const isSelected = opt.is_selected;
                  const isKeyAnswer = opt.is_correct;

                  let bg = token.colorBgLayout;
                  let borderColor = token.colorBorderSecondary;
                  let indicator = null;

                  if (isSelected && isCorrect) {
                    bg = '#dcfce7';
                    borderColor = '#86efac';
                    indicator = (
                      <Tag color="success" style={{ borderRadius: 4, fontWeight: 700 }}>
                        Your Correct Answer ✓
                      </Tag>
                    );
                  } else if (isSelected && !isCorrect) {
                    bg = '#fee2e2';
                    borderColor = '#fca5a5';
                    indicator = (
                      <Tag color="error" style={{ borderRadius: 4, fontWeight: 700 }}>
                        Your Selection ✕
                      </Tag>
                    );
                  } else if (isKeyAnswer && reviewData.show_correct_answers) {
                    bg = '#f0fdf4';
                    borderColor = '#bbf7d0';
                    indicator = (
                      <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 700 }}>
                        Correct Answer
                      </Tag>
                    );
                  }

                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderRadius: 6,
                        backgroundColor: bg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{opt.content}</Text>
                      {indicator}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
