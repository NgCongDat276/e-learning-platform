import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Tag,
  Table,
  Avatar,
  Progress,
  Button,
  Empty,
  Skeleton,
  Modal,
  App,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TrophyOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  EyeOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import {
  getTeacherQuizAnalyticsApi,
  getQuizAttemptResultApi,
} from '../../../api/quiz.api';
import type {
  TeacherQuizAnalyticsData,
  TeacherAttemptItem,
  QuizAttemptReviewData,
} from '../../../types/quiz.types';

const { Title, Text, Paragraph } = Typography;

export interface QuizAnalyticsDrawerProps {
  open: boolean;
  lessonId: string | null;
  lessonTitle: string;
  onClose: () => void;
}

const formatDurationSecs = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const QuizAnalyticsDrawer: React.FC<QuizAnalyticsDrawerProps> = ({
  open,
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const [loading, setLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<TeacherQuizAnalyticsData | null>(
    null
  );

  // State xem chi tiết bài làm của 1 lần thi
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);
  const [reviewDetail, setReviewDetail] =
    useState<QuizAttemptReviewData | null>(null);
  const [reviewStudentName, setReviewStudentName] = useState<string>('');

  useEffect(() => {
    if (!open || !lessonId) return;

    let ignore = false;
    setLoading(true);

    getTeacherQuizAnalyticsApi(lessonId)
      .then((res) => {
        if (!ignore && res.success && res.data) {
          setAnalytics(res.data);
        }
      })
      .catch(() => {
        if (!ignore) {
          message.error('Failed to load quiz analytics');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [open, lessonId, message]);

  const handleOpenAttemptReview = async (record: TeacherAttemptItem) => {
    setLoadingReviewId(record.id);
    try {
      const res = await getQuizAttemptResultApi(record.id);
      if (res.success && res.data) {
        setReviewDetail(res.data);
        setReviewStudentName(record.user.full_name);
        setReviewModalOpen(true);
      }
    } catch {
      message.error('Could not load student attempt answers');
    } finally {
      setLoadingReviewId(null);
    }
  };

  const summary = analytics?.summary;
  const hardestQuestions = analytics?.hardest_questions || [];
  const attempts = analytics?.attempts || [];

  const columns: ColumnsType<TeacherAttemptItem> = [
    {
      title: 'Learner',
      key: 'learner',
      render: (_, record) => (
        <Space size={10}>
          <Avatar
            size={34}
            src={record.user.avatar_url || undefined}
            icon={!record.user.avatar_url ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: '#fef9c3',
              color: token.colorText,
              border: `1px solid ${token.colorText}`,
              fontWeight: 700,
            }}
          >
            {!record.user.avatar_url
              ? record.user.full_name?.charAt(0).toUpperCase()
              : null}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13.5 }}>
              {record.user.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Attempt',
      dataIndex: 'attempt_number',
      key: 'attempt_number',
      width: 90,
      align: 'center',
      render: (num: number) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 9999,
            fontWeight: 600,
            backgroundColor: '#f5f5f4',
            borderColor: token.colorBorder,
            color: token.colorText,
          }}
        >
          #{num}
        </Tag>
      ),
    },
    {
      title: 'Score & Outcome',
      key: 'score',
      width: 165,
      render: (_, record) => {
        if (record.status !== 'submitted') {
          return (
            <Tag
              style={{
                borderRadius: 9999,
                backgroundColor: '#fef3c7',
                borderColor: '#fde68a',
                color: '#b45309',
                fontWeight: 600,
              }}
            >
              In Progress
            </Tag>
          );
        }

        return (
          <Space size={8}>
            <Text
              strong
              style={{
                fontSize: 15,
                color: record.is_passed ? '#059669' : '#ef4444',
              }}
            >
              {record.score}%
            </Text>
            <Tag
              icon={
                record.is_passed ? (
                  <CheckCircleFilled />
                ) : (
                  <CloseCircleFilled />
                )
              }
              style={{
                margin: 0,
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                backgroundColor: record.is_passed ? '#dcfff1' : '#fef2f2',
                borderColor: record.is_passed ? '#7ee2b8' : '#fecaca',
                color: record.is_passed ? '#065f46' : '#b91c1c',
              }}
            >
              {record.is_passed ? 'Passed' : 'Failed'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Duration & Submitted',
      key: 'submitted_at',
      width: 175,
      render: (_, record) => (
        <div>
          <Text style={{ display: 'block', fontSize: 12.5 }}>
            <ClockCircleOutlined style={{ marginRight: 5, color: '#737373' }} />
            {formatDurationSecs(record.duration_seconds)}
          </Text>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            {formatDateTime(record.submitted_at || record.started_at)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      align: 'right',
      render: (_, record) =>
        record.status === 'submitted' ? (
          <Button
            size="small"
            icon={<EyeOutlined />}
            loading={loadingReviewId === record.id}
            onClick={() => void handleOpenAttemptReview(record)}
            style={{
              borderRadius: 4,
              fontWeight: 600,
              borderColor: token.colorText,
              boxShadow: '1px 1px 0px 0px #262626',
            }}
          >
            Answers
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: token.colorTextSecondary,
                display: 'block',
              }}
            >
              Quiz Assessment Analytics
            </Text>
            <Title level={4} style={{ margin: 0, fontSize: 18 }}>
              {lessonTitle}
            </Title>
          </div>
        }
        placement="right"
        width={780}
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
        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : !analytics || !summary ? (
          <Empty description="This quiz has not been configured yet." />
        ) : (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* 1. KPI Summary Row */}
            <Row gutter={[14, 14]}>
              <Col xs={12} sm={6}>
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
                    Avg. Score
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: '4px 0 2px 0', color: token.colorText }}
                  >
                    {summary.avg_score !== null ? `${summary.avg_score}%` : '—'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Range:{' '}
                    {summary.lowest_score !== null
                      ? `${summary.lowest_score}% – ${summary.highest_score}%`
                      : 'No data'}
                  </Text>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
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
                    Pass Rate
                  </Text>
                  <Title
                    level={3}
                    style={{
                      margin: '4px 0 2px 0',
                      color: '#059669',
                    }}
                  >
                    {summary.pass_rate !== null ? `${summary.pass_rate}%` : '—'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    {summary.passed_students} / {summary.unique_students} students
                    passed
                  </Text>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
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
                    Total Attempts
                  </Text>
                  <Title level={3} style={{ margin: '4px 0 2px 0' }}>
                    {summary.submitted_attempts}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Pass threshold: {summary.passing_score}%
                  </Text>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
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
                    Avg. Duration
                  </Text>
                  <Title level={3} style={{ margin: '4px 0 2px 0' }}>
                    {formatDurationSecs(summary.avg_duration_seconds)}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Limit:{' '}
                    {summary.time_limit_minutes
                      ? `${summary.time_limit_minutes} mins`
                      : 'No limit'}
                  </Text>
                </Card>
              </Col>
            </Row>

            {/* 2. Most Missed Questions (Item Analysis) */}
            <Card
              title={
                <Space size={8}>
                  <WarningOutlined style={{ color: '#f59e0b' }} />
                  <Text strong style={{ fontSize: 15 }}>
                    Most Missed Questions (Item Difficulty Analysis)
                  </Text>
                </Space>
              }
              styles={{ body: { padding: '16px 20px' } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
            >
              {hardestQuestions.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No submitted answers yet to analyze question difficulty."
                />
              ) : (
                <Space
                  direction="vertical"
                  size={14}
                  style={{ width: '100%' }}
                >
                  {hardestQuestions.map((q, idx) => (
                    <div
                      key={q.bank_question_id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 6,
                        backgroundColor: '#fcfff7',
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                          marginBottom: 6,
                        }}
                      >
                        <Text strong style={{ fontSize: 13.5, flex: 1 }}>
                          {idx + 1}. {q.content}
                        </Text>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 9999,
                            fontWeight: 700,
                            backgroundColor:
                              q.incorrect_rate >= 50 ? '#fef2f2' : '#dcfff1',
                            borderColor:
                              q.incorrect_rate >= 50 ? '#fecaca' : '#7ee2b8',
                            color:
                              q.incorrect_rate >= 50 ? '#b91c1c' : '#065f46',
                          }}
                        >
                          {q.incorrect_rate}% Incorrect
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Space size={6} wrap>
                          <Tag
                            style={{
                              margin: 0,
                              fontSize: 11,
                              borderRadius: 9999,
                            }}
                          >
                            Topic: {q.topic}
                          </Tag>
                          <Tag
                            style={{
                              margin: 0,
                              fontSize: 11,
                              borderRadius: 9999,
                              textTransform: 'capitalize',
                            }}
                          >
                            {q.difficulty}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Correct: {q.correct_count}/{q.total_answered} responses
                          </Text>
                        </Space>

                        <div style={{ width: 160 }}>
                          <Progress
                            percent={q.correct_rate}
                            size="small"
                            strokeColor={
                              q.correct_rate >= 60 ? '#059669' : '#f59e0b'
                            }
                            format={(p) => `${p}% Correct`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </Card>

            {/* 3. Student Submission History Table */}
            <Card
              title={
                <Space size={8}>
                  <FileDoneOutlined />
                  <Text strong style={{ fontSize: 15 }}>
                    Student Attempts History ({attempts.length})
                  </Text>
                </Space>
              }
              styles={{ body: { padding: 0 } }}
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
                boxShadow: '1px 1px 0px 0px #262626',
                overflow: 'hidden',
              }}
            >
              <Table<TeacherAttemptItem>
                rowKey="id"
                columns={columns}
                dataSource={attempts}
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                size="middle"
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No students have taken this quiz yet."
                    />
                  ),
                }}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Modal Xem chi tiết bài làm của học viên */}
      <Modal
        title={
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              Student Submission Review
            </Text>
            <Title level={4} style={{ margin: 0, fontSize: 17 }}>
              {reviewStudentName} — Attempt #{reviewDetail?.attempt_number} (
              {reviewDetail?.score}%)
            </Title>
          </div>
        }
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setReviewModalOpen(false)}
            style={{ borderRadius: 4, fontWeight: 600 }}
          >
            Close
          </Button>,
        ]}
        width={680}
      >
        {reviewDetail && (
          <div
            style={{
              maxHeight: '65vh',
              overflowY: 'auto',
              paddingRight: 6,
              marginTop: 12,
            }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {reviewDetail.questions.map((q, index) => (
                <div
                  key={q.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: `1px solid ${
                      q.is_correct ? '#7ee2b8' : '#fecaca'
                    }`,
                    backgroundColor: q.is_correct ? '#f0fdf4' : '#fef2f2',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text strong style={{ fontSize: 14 }}>
                      Question {index + 1}: {q.content}
                    </Text>
                    <Tag
                      style={{
                        margin: 0,
                        borderRadius: 9999,
                        fontWeight: 700,
                        backgroundColor: q.is_correct ? '#dcfff1' : '#fee2e2',
                        borderColor: q.is_correct ? '#7ee2b8' : '#fca5a5',
                        color: q.is_correct ? '#065f46' : '#991b1b',
                      }}
                    >
                      {q.points_earned} / {q.points_snapshot} pt
                    </Tag>
                  </div>

                  <Space
                    direction="vertical"
                    size={6}
                    style={{ width: '100%' }}
                  >
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 4,
                          backgroundColor: '#ffffff',
                          border: `1px solid ${
                            opt.is_correct
                              ? '#059669'
                              : opt.is_selected
                                ? '#ef4444'
                                : token.colorBorder
                          }`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Paragraph
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight:
                              opt.is_selected || opt.is_correct ? 600 : 400,
                          }}
                        >
                          {opt.content}
                        </Paragraph>
                        <Space size={4}>
                          {opt.is_selected && (
                            <Tag
                              style={{
                                margin: 0,
                                fontSize: 11,
                                borderRadius: 9999,
                                backgroundColor: opt.is_correct
                                  ? '#dcfff1'
                                  : '#fee2e2',
                                color: opt.is_correct ? '#065f46' : '#991b1b',
                                borderColor: opt.is_correct
                                  ? '#7ee2b8'
                                  : '#fca5a5',
                              }}
                            >
                              Selected
                            </Tag>
                          )}
                          {opt.is_correct && (
                            <Tag
                              icon={<TrophyOutlined />}
                              style={{
                                margin: 0,
                                fontSize: 11,
                                borderRadius: 9999,
                                backgroundColor: '#dcfff1',
                                color: '#065f46',
                                borderColor: '#7ee2b8',
                              }}
                            >
                              Correct Answer
                            </Tag>
                          )}
                        </Space>
                      </div>
                    ))}
                  </Space>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
};

