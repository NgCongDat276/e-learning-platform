import React from 'react';
import { Card, Typography, Progress, Button, Tag, Space, Skeleton, theme } from 'antd';
import {
  PlayCircleOutlined,
  PlayCircleFilled,
  RightOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { QuickResumeLastLesson } from '../../../types/enrollment.types';

const { Title, Text } = Typography;

interface StudentQuickResumeBannerProps {
  lastLesson?: QuickResumeLastLesson | null;
  loading?: boolean;
}

const formatSeconds = (sec: number): string => {
  if (!sec || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const StudentQuickResumeBanner: React.FC<StudentQuickResumeBannerProps> = ({
  lastLesson,
  loading = false,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: token.colorBorder,
          boxShadow: '1px 1px 0px 0px #262626',
          marginBottom: 24,
        }}
        styles={{ body: { padding: '18px 24px' } }}
      >
        <Skeleton active avatar paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  // Nếu học viên chưa có bài học nào
  if (!lastLesson) {
    return null;
  }

  const renderLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlined style={{ color: '#2563eb' }} />;
      case 'quiz':
        return <QuestionCircleOutlined style={{ color: '#7c3aed' }} />;
      default:
        return <BookOutlined style={{ color: '#16a34a' }} />;
    }
  };

  const isVideo = lastLesson.lessonType === 'video';
  const hasWatched = isVideo && lastLesson.lastWatchedPosition > 0;

  return (
    <Card
      bordered
      style={{
        borderRadius: 8,
        borderColor: token.colorBorder,
        boxShadow: '2px 2px 0px 0px #262626',
        backgroundColor: '#f8fafc',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: '18px 24px' } }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
        }}
      >
        {/* Phần thông tin bên trái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 280, flex: 1 }}>
          {/* Thumbnail hoặc Icon đại diện */}
          <div
            style={{
              width: 80,
              height: 56,
              borderRadius: 6,
              overflow: 'hidden',
              backgroundColor: '#e2e8f0',
              border: '1px solid #cbd5e1',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {lastLesson.courseThumbnailUrl ? (
              <img
                src={lastLesson.courseThumbnailUrl}
                alt={lastLesson.courseTitle}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <BookOutlined style={{ fontSize: 24, color: '#64748b' }} />
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: '#fff',
                borderRadius: 3,
                fontSize: 10,
                padding: '1px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {renderLessonTypeIcon(lastLesson.lessonType)}
            </div>
          </div>

          {/* Chi tiết bài học */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  backgroundColor: '#dcfff1',
                  color: '#065f46',
                  border: '1px solid #7ee2b8',
                  margin: 0,
                }}
              >
                {lastLesson.isCompleted
                  ? 'COURSE COMPLETED'
                  : lastLesson.isNextLesson
                  ? 'UP NEXT'
                  : 'IN PROGRESS'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {lastLesson.courseTitle}
              </Text>
            </div>

            <Title
              level={4}
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.3,
                color: token.colorText,
              }}
              ellipsis
            >
              {lastLesson.lessonTitle}
            </Title>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {lastLesson.chapterTitle}
              </Text>
              {hasWatched && (
                <Space size={4}>
                  <ClockCircleOutlined style={{ fontSize: 11, color: token.colorTextSecondary }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Paused at: {formatSeconds(lastLesson.lastWatchedPosition)}
                  </Text>
                </Space>
              )}
            </div>
          </div>
        </div>

        {/* Thanh Progress và Nút Kêu Gọi Hành Động (CTA) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexShrink: 0,
          }}
        >
          {/* Thanh tiến độ khóa học */}
          <div style={{ width: 140, display: 'none' }} className="d-sm-block">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              <Text type="secondary">Course Progress</Text>
              <Text strong>{lastLesson.progressPercent}%</Text>
            </div>
            <Progress
              percent={lastLesson.progressPercent}
              showInfo={false}
              size="small"
              strokeColor="#10b981"
              trailColor="#e2e8f0"
            />
          </div>

          {/* Nút bấm theo Primary CTA Design System */}
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleFilled style={{ color: '#262626' }} />}
            onClick={() => navigate(lastLesson.resumeUrl)}
            style={{
              backgroundColor: '#a3e635', // Primary CTA Lime Sprint
              borderColor: '#262626',
              color: '#262626', // STRICT RULE: MUST BE DARK/INK, NEVER WHITE
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 4,
              boxShadow: '1px 1px 0px 0px #262626',
              height: 40,
              padding: '0 20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {lastLesson.isCompleted ? 'Review Lesson' : 'Resume Learning'}
            <RightOutlined style={{ fontSize: 12 }} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
