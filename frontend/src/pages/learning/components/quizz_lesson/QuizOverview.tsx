import React from 'react';
import { Typography, Button, Tag, Space, theme } from 'antd';
import {
  PlayCircleOutlined,
  HistoryOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import type { QuizOverviewProps } from './types';

const { Title, Text, Paragraph } = Typography;

export const QuizOverview: React.FC<QuizOverviewProps> = ({
  quiz,
  studentSummary,
  lessonTitle,
  isLessonCompleted,
  myAttempts,
  loadingReview,
  onStartAttempt,
  onResumeAttempt,
  onViewReview,
}) => {
  const { token } = theme.useToken();

  const isPassed = studentSummary?.is_passed || isLessonCompleted;
  const canAttempt = studentSummary?.can_attempt ?? true;
  const activeAttemptId = studentSummary?.active_attempt_id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner Card */}
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 8,
          padding: '32px 36px',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <Space size="small" style={{ marginBottom: 8 }}>
              <Tag
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: 9999,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: 11,
                }}
              >
                Diagnostic Quiz
              </Tag>
              {isPassed && (
                <Tag
                  color="success"
                  style={{ borderRadius: 9999, fontWeight: 700, fontSize: 11 }}
                >
                  Passed ✓
                </Tag>
              )}
            </Space>
            <Title level={2} style={{ margin: '0 0 8px 0', fontSize: 24, letterSpacing: -0.5 }}>
              {quiz.title || lessonTitle}
            </Title>
            {quiz.description && (
              <Paragraph
                type="secondary"
                style={{ margin: 0, fontSize: 15, maxWidth: 680, lineHeight: 1.6 }}
              >
                {quiz.description}
              </Paragraph>
            )}
          </div>

          {/* Main Action CTA */}
          <div>
            {activeAttemptId ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => void onResumeAttempt(activeAttemptId)}
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: '#f59e0b',
                  borderColor: '#262626',
                  color: '#000000',
                  boxShadow: 'var(--shadow-hard)',
                  height: 44,
                  padding: '0 24px',
                }}
              >
                Resume In-Progress Quiz
              </Button>
            ) : canAttempt ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => void onStartAttempt()}
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: token.colorPrimary,
                  borderColor: '#262626',
                  color: '#262626',
                  boxShadow: 'var(--shadow-hard)',
                  height: 44,
                  padding: '0 28px',
                }}
              >
                {myAttempts.length > 0 ? 'Retake Assessment' : 'Start Assessment'}
              </Button>
            ) : (
              <Button
                disabled
                size="large"
                style={{ borderRadius: 4, fontWeight: 600, height: 44 }}
              >
                Attempts Limit Reached
              </Button>
            )}
          </div>
        </div>

        {/* Assessment Criteria Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: token.colorBgLayout,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
              Passing Benchmark
            </Text>
            <Text strong style={{ fontSize: 18, color: '#059669' }}>
              {quiz.passing_score}% Score
            </Text>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: token.colorBgLayout,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
              Allocated Duration
            </Text>
            <Text strong style={{ fontSize: 18, color: token.colorText }}>
              {quiz.time_limit_minutes && quiz.time_limit_minutes > 0
                ? `${quiz.time_limit_minutes} Minutes`
                : 'Untimed'}
            </Text>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: token.colorBgLayout,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
              Attempts Allowance
            </Text>
            <Text strong style={{ fontSize: 18, color: token.colorText }}>
              {quiz.max_attempts > 0 ? `${quiz.max_attempts} Times` : 'Unlimited'}
            </Text>
            {quiz.max_attempts > 0 && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                ({Math.max(0, quiz.max_attempts - myAttempts.length)} remaining)
              </Text>
            )}
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: token.colorBgLayout,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
              Best Record
            </Text>
            <Text
              strong
              style={{
                fontSize: 18,
                color:
                  (studentSummary?.best_score || 0) >= quiz.passing_score
                    ? '#059669'
                    : token.colorText,
              }}
            >
              {studentSummary?.best_score !== undefined
                ? `${studentSummary.best_score}%`
                : 'N/A'}
            </Text>
          </div>
        </div>
      </div>

      {/* Previous Attempts History Section */}
      {myAttempts.length > 0 && (
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: '24px 28px',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <HistoryOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
            <Title level={4} style={{ margin: 0, fontSize: 18 }}>
              Previous Assessment Attempts
            </Title>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myAttempts.map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderRadius: 6,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  backgroundColor: token.colorBgLayout,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Space size="middle" wrap>
                  <Text strong style={{ fontSize: 15 }}>
                    Attempt #{attempt.attempt_number}
                  </Text>
                  <Tag
                    color={
                      attempt.status === 'in_progress'
                        ? 'warning'
                        : attempt.is_passed
                          ? 'success'
                          : 'error'
                    }
                    style={{ borderRadius: 9999, fontWeight: 700 }}
                  >
                    {attempt.status === 'in_progress'
                      ? 'IN PROGRESS'
                      : attempt.is_passed
                        ? 'PASSED'
                        : 'FAILED'}
                  </Tag>
                  {attempt.submitted_at && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {new Date(attempt.submitted_at).toLocaleDateString()} at{' '}
                      {new Date(attempt.submitted_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </Space>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {attempt.status === 'submitted' && (
                    <Text
                      strong
                      style={{
                        fontSize: 18,
                        color: attempt.is_passed ? '#059669' : '#dc2626',
                      }}
                    >
                      {attempt.score}%
                    </Text>
                  )}

                  {attempt.status === 'submitted' ? (
                    <Button
                      size="small"
                      icon={<FileDoneOutlined />}
                      loading={loadingReview}
                      onClick={() => void onViewReview(attempt.id)}
                      style={{
                        borderRadius: 4,
                        fontWeight: 600,
                        borderColor: token.colorBorder,
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => void onResumeAttempt(attempt.id)}
                      style={{
                        borderRadius: 4,
                        fontWeight: 700,
                        backgroundColor: '#f59e0b',
                        color: '#000000',
                        borderColor: '#262626',
                      }}
                    >
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
