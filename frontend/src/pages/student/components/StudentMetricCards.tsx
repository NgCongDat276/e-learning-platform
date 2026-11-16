import React from 'react';
import { Row, Col, Card, Typography, Skeleton, theme } from 'antd';
import {
  FireFilled,
  ClockCircleOutlined,
  CheckCircleFilled,
  TrophyOutlined,
} from '@ant-design/icons';
import type { StudentLearningMetrics } from '../../../types/enrollment.types';

const { Text, Title } = Typography;

interface StudentMetricCardsProps {
  metrics?: StudentLearningMetrics;
  loading?: boolean;
}

const formatWatchTime = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0h';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

export const StudentMetricCards: React.FC<StudentMetricCardsProps> = ({
  metrics,
  loading = false,
}) => {
  const { token } = theme.useToken();

  const cardStyle: React.CSSProperties = {
    borderRadius: 8,
    borderColor: token.colorBorder,
    boxShadow: '1px 1px 0px 0px #262626',
    backgroundColor: token.colorBgContainer,
    height: '100%',
  };

  if (loading || !metrics) {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={12} sm={6} key={i}>
            <Card bordered style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const streakDays = metrics.streakDays || 0;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {/* 1. Learning Streak */}
      <Col xs={12} sm={6}>
        <Card bordered style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              <FireFilled />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                }}
              >
                Current Streak
              </Text>
              <Title
                level={3}
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: token.colorText,
                }}
              >
                {streakDays}{' '}
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {streakDays === 1 ? 'day' : 'days'} 🔥
                </span>
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                ellipsis
              >
                {streakDays > 0 ? 'Keep the momentum going!' : 'Start learning today!'}
              </Text>
            </div>
          </div>
        </Card>
      </Col>

      {/* 2. Total Study Time */}
      <Col xs={12} sm={6}>
        <Card bordered style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#f0fdf4',
                border: '1px solid #dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                }}
              >
                Study Time
              </Text>
              <Title
                level={3}
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: token.colorText,
                }}
              >
                {formatWatchTime(metrics.totalWatchTimeSeconds)}
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                ellipsis
              >
                Lectures & quizzes
              </Text>
            </div>
          </div>
        </Card>
      </Col>

      {/* 3. Lessons Completed */}
      <Col xs={12} sm={6}>
        <Card bordered style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              <CheckCircleFilled />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                }}
              >
                Lessons Mastered
              </Text>
              <Title
                level={3}
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: token.colorText,
                }}
              >
                {metrics.completedLessons}
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorTextSecondary }}>
                  /{metrics.totalLessons}
                </span>
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                ellipsis
              >
                {metrics.completionRate}% overall completion
              </Text>
            </div>
          </div>
        </Card>
      </Col>

      {/* 4. Average Quiz Score */}
      <Col xs={12} sm={6}>
        <Card bordered style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: '#f5f3ff',
                border: '1px solid #ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              <TrophyOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                }}
              >
                Average Quiz Score
              </Text>
              <Title
                level={3}
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: token.colorText,
                }}
              >
                {metrics.averageQuizScore}
                <span style={{ fontSize: 13, fontWeight: 500 }}>/100</span>
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                ellipsis
              >
                Passed {metrics.quizzesPassed} of {metrics.totalQuizzesAttempted} quizzes
              </Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

