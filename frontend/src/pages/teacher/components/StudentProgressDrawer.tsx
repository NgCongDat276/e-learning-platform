import React, { useMemo } from 'react';
import {
  Drawer,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Tag,
  Avatar,
  Progress,
  Empty,
  theme,
} from 'antd';
import {
  UserOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CloseCircleFilled,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type {
  CourseStudentItem,
  StudentLessonBreakdownItem,
} from '../../../types/enrollment.types';

const { Title, Text } = Typography;

export interface StudentProgressDrawerProps {
  open: boolean;
  studentItem: CourseStudentItem | null;
  onClose: () => void;
}

const formatWatchTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

export const StudentProgressDrawer: React.FC<StudentProgressDrawerProps> = ({
  open,
  studentItem,
  onClose,
}) => {
  const { token } = theme.useToken();

  // Gom các bài học theo Chương
  const groupedChapters = useMemo(() => {
    if (!studentItem?.lessonBreakdown) return [];
    const map = new Map<
      string,
      { chapterId: string; chapterTitle: string; items: StudentLessonBreakdownItem[] }
    >();

    for (const item of studentItem.lessonBreakdown) {
      const existing = map.get(item.chapterId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.chapterId, {
          chapterId: item.chapterId,
          chapterTitle: item.chapterTitle,
          items: [item],
        });
      }
    }

    return Array.from(map.values());
  }, [studentItem]);

  if (!studentItem) return null;

  const { student } = studentItem;
  const initial = student.full_name
    ? student.full_name.charAt(0).toUpperCase()
    : 'S';

  return (
    <Drawer
      title={
        <Space size={12}>
          <Avatar
            size={42}
            src={student.avatar_url || undefined}
            icon={!student.avatar_url ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: '#fef9c3',
              color: token.colorText,
              border: `1px solid ${token.colorText}`,
              fontWeight: 700,
            }}
          >
            {!student.avatar_url ? initial : null}
          </Avatar>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 17 }}>
              {student.full_name}
            </Title>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {student.email}
            </Text>
          </div>
        </Space>
      }
      placement="right"
      width={660}
      open={open}
      onClose={onClose}
      styles={{
        body: {
          backgroundColor: token.colorBgLayout,
          padding: 24,
        },
        header: {
          borderBottom: `1px solid ${token.colorBorder}`,
        },
      }}
    >
      <Space direction="vertical" size={22} style={{ width: '100%' }}>
        {/* 1. Student KPI Overview */}
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={8}>
            <Card
              styles={{ body: { padding: '14px 16px' } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorText}`,
                boxShadow: '2px 2px 0px 0px #262626',
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Course Completion
              </Text>
              <Title level={3} style={{ margin: '4px 0 4px 0' }}>
                {studentItem.progressPercent}%
              </Title>
              <Progress
                percent={studentItem.progressPercent}
                showInfo={false}
                size="small"
                strokeColor={
                  studentItem.progressPercent === 100
                    ? '#059669'
                    : token.colorPrimary
                }
              />
              <Text type="secondary" style={{ fontSize: 11.5 }}>
                {studentItem.completedLessons} of {studentItem.totalLessons}{' '}
                lessons completed
              </Text>
            </Card>
          </Col>

          <Col xs={12} sm={8}>
            <Card
              styles={{ body: { padding: '14px 16px' } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorText}`,
                boxShadow: '2px 2px 0px 0px #262626',
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Avg. Quiz Score
              </Text>
              <Title
                level={3}
                style={{
                  margin: '4px 0 2px 0',
                  color:
                    studentItem.avgQuizScore !== null &&
                    studentItem.avgQuizScore !== undefined
                      ? '#059669'
                      : token.colorText,
                }}
              >
                {studentItem.avgQuizScore !== null &&
                studentItem.avgQuizScore !== undefined
                  ? `${studentItem.avgQuizScore}%`
                  : '—'}
              </Title>
              <Text type="secondary" style={{ fontSize: 11.5 }}>
                Passed {studentItem.passedQuizzesCount ?? 0} /{' '}
                {studentItem.totalQuizzesCount ?? 0} quizzes
              </Text>
            </Card>
          </Col>

          <Col xs={12} sm={8}>
            <Card
              styles={{ body: { padding: '14px 16px' } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorText}`,
                boxShadow: '2px 2px 0px 0px #262626',
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Quiz Submissions
              </Text>
              <Title level={3} style={{ margin: '4px 0 2px 0' }}>
                {studentItem.totalQuizAttempts ?? 0}
              </Title>
              <Text type="secondary" style={{ fontSize: 11.5 }}>
                Total graded attempts
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 2. Lesson-by-Lesson Breakdown */}
        {groupedChapters.length === 0 ? (
          <Empty description="No curriculum lessons found." />
        ) : (
          groupedChapters.map((ch, chIdx) => (
            <Card
              key={ch.chapterId}
              title={
                <Text strong style={{ fontSize: 14.5 }}>
                  Chapter {chIdx + 1}: {ch.chapterTitle}
                </Text>
              }
              styles={{ body: { padding: '8px 18px' } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
            >
              {ch.items.map((item, idx) => {
                const isLast = idx === ch.items.length - 1;
                const typeIcon =
                  item.lessonType === 'video' ? (
                    <PlayCircleOutlined style={{ color: '#2563eb' }} />
                  ) : item.lessonType === 'quiz' ? (
                    <QuestionCircleOutlined style={{ color: '#d97706' }} />
                  ) : (
                    <FileTextOutlined style={{ color: '#059669' }} />
                  );

                return (
                  <div
                    key={item.lessonId}
                    style={{
                      padding: '12px 0',
                      borderBottom: isLast
                        ? 'none'
                        : `1px solid ${token.colorBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        flex: 1,
                        minWidth: 220,
                      }}
                    >
                      <div style={{ marginTop: 2 }}>{typeIcon}</div>
                      <div>
                        <Text strong style={{ fontSize: 13.5, display: 'block' }}>
                          {item.orderIndex}. {item.lessonTitle}
                        </Text>

                        {item.lessonType === 'video' && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.lastWatchedPosition > 0
                              ? `Watched up to ${formatWatchTime(item.lastWatchedPosition)}`
                              : 'Not watched yet'}
                            {item.durationSeconds > 0
                              ? ` / ${formatWatchTime(item.durationSeconds)}`
                              : ''}
                          </Text>
                        )}

                        {item.lessonType === 'quiz' && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.quizAttemptsCount > 0
                              ? `${item.quizAttemptsCount} attempt(s) • Best Score: ${item.quizBestScore}%`
                              : 'No quiz attempt submitted yet'}
                          </Text>
                        )}

                        {item.lessonType === 'text' && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Reading & Document Lesson
                          </Text>
                        )}
                      </div>
                    </div>

                    {/* Right Status Badge */}
                    <div>
                      {item.lessonType === 'quiz' ? (
                        item.quizAttemptsCount === 0 ? (
                          <Tag
                            icon={<MinusCircleOutlined />}
                            style={{
                              margin: 0,
                              borderRadius: 9999,
                              color: token.colorTextSecondary,
                            }}
                          >
                            Not Attempted
                          </Tag>
                        ) : item.quizPassed ? (
                          <Tag
                            icon={<CheckCircleFilled />}
                            style={{
                              margin: 0,
                              borderRadius: 9999,
                              fontWeight: 600,
                              backgroundColor: '#dcfff1',
                              borderColor: '#7ee2b8',
                              color: '#065f46',
                            }}
                          >
                            Passed ({item.quizBestScore}%)
                          </Tag>
                        ) : (
                          <Tag
                            icon={<CloseCircleFilled />}
                            style={{
                              margin: 0,
                              borderRadius: 9999,
                              fontWeight: 600,
                              backgroundColor: '#fef2f2',
                              borderColor: '#fecaca',
                              color: '#b91c1c',
                            }}
                          >
                            Failed ({item.quizBestScore}%)
                          </Tag>
                        )
                      ) : item.isCompleted ? (
                        <Tag
                          icon={<CheckCircleFilled />}
                          style={{
                            margin: 0,
                            borderRadius: 9999,
                            fontWeight: 600,
                            backgroundColor: '#dcfff1',
                            borderColor: '#7ee2b8',
                            color: '#065f46',
                          }}
                        >
                          Completed
                        </Tag>
                      ) : item.lastWatchedPosition > 0 ? (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          style={{
                            margin: 0,
                            borderRadius: 9999,
                            fontWeight: 600,
                            backgroundColor: '#fef9c3',
                            borderColor: '#fde047',
                            color: '#854d0e',
                          }}
                        >
                          In Progress
                        </Tag>
                      ) : (
                        <Tag
                          icon={<MinusCircleOutlined />}
                          style={{
                            margin: 0,
                            borderRadius: 9999,
                            color: token.colorTextSecondary,
                          }}
                        >
                          Not Started
                        </Tag>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          ))
        )}
      </Space>
    </Drawer>
  );
};

