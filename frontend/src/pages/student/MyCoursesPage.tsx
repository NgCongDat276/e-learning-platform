import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Progress,
  Tag,
  Button,
  Space,
  Avatar,
  Empty,
  Skeleton,
  Segmented,
  Tooltip,
  theme,
  App,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  TrophyOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  getMyEnrolledCoursesApi,
  getMyLearningStatsApi,
} from '../../api/enrollment.api';
import type {
  MyEnrolledCourse,
  StudentLearningStatsData,
} from '../../types/enrollment.types';
import {
  StudentMetricCards,
  StudentActivityHeatmap,
  StudentQuickResumeBanner,
} from './components';

const { Title, Text, Paragraph } = Typography;

// Curated fallback thumbnails matching Editorial design
const fallbackThumbnails = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80',
];

export const MyCoursesPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const navigate = useNavigate();

  // Data states
  const [courses, setCourses] = useState<MyEnrolledCourse[]>([]);
  const [learningStats, setLearningStats] = useState<StudentLearningStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress_desc' | 'alphabetical'>('recent');

  // Fetch enrolled courses & learning statistics
  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);

    // Tải song song cả danh sách khóa học và số liệu thống kê học tập
    const coursesPromise = getMyEnrolledCoursesApi()
      .then((res) => {
        if (res.success && res.data) {
          setCourses(res.data);
        }
      })
      .catch((err: unknown) => {
        if (isAxiosError(err)) {
          message.error(err.response?.data?.message || 'Failed to load your enrolled courses');
        } else {
          message.error('An unexpected error occurred while loading your courses');
        }
      })
      .finally(() => setLoading(false));

    const statsPromise = getMyLearningStatsApi()
      .then((res) => {
        if (res.success && res.data) {
          setLearningStats(res.data);
        }
      })
      .catch(() => {
        // Silent fail hoặc fallback cho stats để không chặn load khóa học chính
      })
      .finally(() => setStatsLoading(false));

    await Promise.allSettled([coursesPromise, statsPromise]);
  }, [message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await Promise.resolve();
      if (!ignore) {
        await fetchPageData();
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [fetchPageData]);

  // Statistics
  const stats = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => c.progressPercent === 100).length;
    const inProgress = courses.filter((c) => c.progressPercent < 100).length;
    const totalLessonsMastered = courses.reduce((acc, c) => acc + c.completedLessons, 0);

    return { total, completed, inProgress, totalLessonsMastered };
  }, [courses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Status filter
    if (statusFilter === 'in_progress') {
      result = result.filter((c) => c.progressPercent < 100);
    } else if (statusFilter === 'completed') {
      result = result.filter((c) => c.progressPercent === 100);
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.course.title.toLowerCase().includes(q) ||
          c.course.instructor?.full_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'progress_desc') {
        return b.progressPercent - a.progressPercent;
      }
      if (sortBy === 'alphabetical') {
        return a.course.title.localeCompare(b.course.title);
      }
      // 'recent' by enrolled_at
      return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
    });

    return result;
  }, [courses, statusFilter, searchTerm, sortBy]);

  // Render course level badge
  const renderLevelBadge = (level?: string | null) => {
    const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
      beginner: { label: 'Beginner', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      intermediate: { label: 'Intermediate', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      advanced: { label: 'Advanced', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    };

    const cur = config[level || 'beginner'] || config.beginner;
    return (
      <Tag
        style={{
          borderRadius: 9999,
          fontWeight: 600,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          backgroundColor: cur.bg,
          color: cur.color,
          border: `1px solid ${cur.border}`,
          margin: 0,
        }}
      >
        {cur.label}
      </Tag>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: token.colorBgLayout, // #fcfff7 Cream
        padding: '36px 24px 64px 24px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* 1. Header Hero Banner */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: '28px 32px',
            boxShadow: '1px 1px 0px 0px #262626',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  backgroundColor: '#dcfff1',
                  color: '#065f46',
                  border: '1px solid #7ee2b8',
                }}
              >
                STUDENT WORKSPACE
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Continuous Learning Portal
              </Text>
            </div>
            <Title level={2} style={{ margin: 0, fontSize: 28, letterSpacing: -0.6 }}>
              My Enrolled Courses
            </Title>
            <Paragraph
              type="secondary"
              style={{ margin: '6px 0 0 0', fontSize: 14, maxWidth: 640 }}
            >
              Resume your active coursework, monitor your completion metrics, and revisit completed
              materials at your own pace.
            </Paragraph>
          </div>

          <Space size="middle">
            <Button
              icon={<CompassOutlined />}
              onClick={() => navigate('/courses')}
              style={{
                borderRadius: 4,
                fontWeight: 600,
                borderColor: token.colorBorder,
              }}
            >
              Browse Catalog
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void fetchPageData()}
              loading={loading || statsLoading}
              style={{ borderRadius: 4 }}
            />
          </Space>
        </div>

        {/* 2. Upgraded Metrics Cards (Streak, Study Time, Lessons, Quiz Score) */}
        <StudentMetricCards
          metrics={learningStats?.metrics}
          loading={statsLoading}
        />

        {/* 3. GitHub-style Activity Heatmap (100% width, ~4 months) */}
        <StudentActivityHeatmap
          heatmap={learningStats?.heatmap}
          loading={statsLoading}
        />

        {/* 4. Quick Resume Banner (Continue learning last active lesson) */}
        <StudentQuickResumeBanner
          lastLesson={learningStats?.recentActivity.lastLesson}
          loading={statsLoading}
        />

        {/* 5. Filter & Controls Toolbar */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 24,
            boxShadow: '1px 1px 0px 0px #262626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Segmented Filter */}
          <Segmented
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as 'all' | 'in_progress' | 'completed')}
            options={[
              { label: `All Courses (${stats.total})`, value: 'all' },
              { label: `In Progress (${stats.inProgress})`, value: 'in_progress' },
              { label: `Completed (${stats.completed})`, value: 'completed' },
            ]}
            style={{ fontWeight: 600 }}
          />

          {/* Search & Sort inputs */}
          <Space size="middle" wrap>
            <Input
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Search enrolled courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: 240, borderRadius: 4 }}
            />

            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              style={{ width: 180 }}
              options={[
                { label: 'Recently Enrolled', value: 'recent' },
                { label: 'Highest Progress', value: 'progress_desc' },
                { label: 'Alphabetical', value: 'alphabetical' },
              ]}
            />
          </Space>
        </div>

        {/* 4. Course Cards Grid */}
        {loading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <Card
                  style={{
                    borderRadius: 8,
                    borderColor: token.colorBorder,
                    boxShadow: '1px 1px 0px 0px #262626',
                  }}
                >
                  <Skeleton.Image style={{ width: '100%', height: 160, marginBottom: 16 }} active />
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredCourses.length === 0 ? (
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              backgroundColor: token.colorBgContainer,
              borderRadius: 8,
              border: `1px solid ${token.colorBorder}`,
              boxShadow: '1px 1px 0px 0px #262626',
            }}
          >
            {courses.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={6} style={{ maxWidth: 440 }}>
                    <Text strong style={{ fontSize: 17 }}>
                      You haven't enrolled in any courses yet
                    </Text>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      Start your learning path by exploring our library of web development, AI, and
                      software architecture courses.
                    </Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  icon={<CompassOutlined />}
                  onClick={() => navigate('/courses')}
                  style={{
                    marginTop: 12,
                    backgroundColor: token.colorPrimary,
                    color: token.colorText,
                    border: `1px solid ${token.colorText}`,
                    fontWeight: 700,
                    borderRadius: 4,
                    boxShadow: 'var(--shadow-hard)',
                  }}
                >
                  Browse Course Catalog
                </Button>
              </Empty>
            ) : (
              <Empty
                description={
                  <Space direction="vertical" size={6}>
                    <Text strong style={{ fontSize: 16 }}>
                      No enrolled courses match your search or filter
                    </Text>
                    <Text type="secondary">
                      Try searching with different keywords or switch the filter tab.
                    </Text>
                  </Space>
                }
              >
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  style={{ borderRadius: 4, marginTop: 8 }}
                >
                  Reset Filters
                </Button>
              </Empty>
            )}
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredCourses.map((item, index) => {
              const { course, totalLessons, completedLessons, progressPercent } = item;
              const thumbnailSrc =
                course.thumbnail_url || fallbackThumbnails[index % fallbackThumbnails.length];
              const isCompleted = progressPercent === 100;
              const classroomLink = `/courses/${course.slug}/learn`;

              return (
                <Col xs={24} sm={12} lg={8} key={item.id}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 8,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer,
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '1px 1px 0px 0px #262626',
                      transition: 'all 0.2s ease',
                    }}
                    styles={{
                      body: {
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'space-between',
                      },
                    }}
                  >
                    <div>
                      {/* Thumbnail Banner */}
                      <div
                        style={{
                          height: 160,
                          width: 'calc(100% + 40px)',
                          margin: '-20px -20px 16px -20px',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#262626',
                        }}
                      >
                        <img
                          src={thumbnailSrc}
                          alt={course.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'brightness(0.95)',
                          }}
                        />

                        {/* Top Badges */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'flex',
                            gap: 6,
                          }}
                        >
                          {renderLevelBadge(course.level)}
                        </div>

                        {/* Top Right Status Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                          }}
                        >
                          {isCompleted ? (
                            <Tag
                              icon={<CheckCircleFilled />}
                              style={{
                                borderRadius: 9999,
                                fontWeight: 700,
                                fontSize: 11,
                                backgroundColor: '#dcfff1',
                                color: '#065f46',
                                border: '1px solid #7ee2b8',
                                margin: 0,
                              }}
                            >
                              Completed
                            </Tag>
                          ) : (
                            <Tag
                              icon={<ClockCircleOutlined />}
                              style={{
                                borderRadius: 9999,
                                fontWeight: 700,
                                fontSize: 11,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                color: token.colorText,
                                border: `1px solid ${token.colorBorder}`,
                                margin: 0,
                              }}
                            >
                              In Progress
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* Course Title */}
                      <Link to={classroomLink}>
                        <Title
                          level={4}
                          ellipsis={{ rows: 2 }}
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: 18,
                            lineHeight: 1.35,
                            letterSpacing: -0.3,
                            color: token.colorText,
                            minHeight: 48,
                          }}
                        >
                          {course.title}
                        </Title>
                      </Link>

                      {/* Instructor Info */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 16,
                        }}
                      >
                        <Avatar
                          size={24}
                          src={course.instructor?.avatar_url || undefined}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}
                        />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {course.instructor?.full_name || 'Verified Lecturer'}
                        </Text>
                      </div>

                      {/* Progress Bar & Counter */}
                      <div
                        style={{
                          backgroundColor: token.colorBgLayout,
                          border: `1px solid ${token.colorBorder}`,
                          borderRadius: 6,
                          padding: '12px 14px',
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                            fontSize: 12,
                          }}
                        >
                          <Text type="secondary">
                            {completedLessons}/{totalLessons} Lessons Done
                          </Text>
                          <Text strong style={{ color: isCompleted ? '#059669' : token.colorText }}>
                            {progressPercent}%
                          </Text>
                        </div>
                        <Progress
                          percent={progressPercent}
                          showInfo={false}
                          strokeColor={isCompleted ? '#059669' : token.colorPrimary}
                          size="small"
                        />
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div
                      style={{
                        paddingTop: 14,
                        borderTop: `1px solid ${token.colorBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Button
                        type="primary"
                        icon={isCompleted ? <TrophyOutlined /> : <PlayCircleOutlined />}
                        onClick={() => navigate(classroomLink)}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 4,
                          fontWeight: 700,
                          backgroundColor: isCompleted ? '#059669' : token.colorPrimary,
                          color: isCompleted ? '#ffffff' : token.colorText,
                          border: `1px solid ${token.colorText}`,
                          boxShadow: '1px 1px 0px 0px #262626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {isCompleted ? 'Review Course' : 'Continue Learning'}
                        <ArrowRightOutlined style={{ fontSize: 12 }} />
                      </Button>

                      <Tooltip title="View Course Overview">
                        <Link to={`/courses/${course.slug}`}>
                          <Button
                            icon={<InfoCircleOutlined />}
                            style={{
                              borderRadius: 4,
                              height: 38,
                              width: 38,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          />
                        </Link>
                      </Tooltip>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
};
