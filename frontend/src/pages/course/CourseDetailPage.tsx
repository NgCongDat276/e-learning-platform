import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Button,
  Breadcrumb,
  Collapse,
  Avatar,
  Divider,
  Space,
  Skeleton,
  Empty,
  theme,
  App,
} from 'antd';
import {
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getCourseBySlugApi } from '../../api/course.api';
import type { CourseDetail } from '../../types/course.types';
import { useAuth } from '../../context/useAuth';

const { Title, Paragraph, Text } = Typography;

export const CourseDetailPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    const fetchDetail = async () => {
      await Promise.resolve();
      if (ignore) return;

      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getCourseBySlugApi(slug);
        if (ignore) return;
        if (res.success && res.data) {
          setCourse(res.data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch (error: unknown) {
        if (ignore) return;
        if (isAxiosError(error) && error.response?.status === 404) {
          setNotFound(true);
        } else {
          message.error('Failed to load course details');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchDetail();

    return () => {
      ignore = true;
    };
  }, [slug, message]);

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || price === 0 || price === '0') {
      return 'Free';
    }
    const num = Number(price);
    if (isNaN(num)) return String(price);
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  const formatDuration = (totalSeconds: number | undefined) => {
    if (!totalSeconds || totalSeconds <= 0) return 'Self-paced';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes} minutes`;
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      message.info('Please sign in to enroll in this course');
      navigate('/login');
      return;
    }
    message.success(
      'Enrollment feature will be active upon completing Module 5. Stay tuned!'
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[32, 32]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Col>
          <Col xs={24} lg={8}>
            <Skeleton.Node style={{ width: '100%', height: 320 }} active>
              <div />
            </Skeleton.Node>
          </Col>
        </Row>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div
        style={{
          padding: '80px 24px',
          textAlign: 'center',
          backgroundColor: token.colorBgContainer,
          borderRadius: 8,
          border: `1px solid ${token.colorBorder}`,
        }}
      >
        <Empty
          description={
            <Space direction="vertical" size="small">
              <Text strong style={{ fontSize: 18 }}>
                Course Not Found
              </Text>
              <Text type="secondary">
                The requested course slug might have been renamed, removed, or is still in draft mode.
              </Text>
            </Space>
          }
        >
          <Link to="/courses">
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              style={{
                marginTop: 16,
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                border: `1px solid ${token.colorText}`,
                fontWeight: 600,
              }}
            >
              Back to Catalog
            </Button>
          </Link>
        </Empty>
      </div>
    );
  }

  const instructorName = course.users?.full_name || 'Verified Lecturer';
  const totalChapters = course.chapters?.length || 0;
  const totalLessons = course.summary?.totalLessons || 0;
  const totalDuration = formatDuration(course.summary?.totalDurationSeconds);
  const enrolledCount = course._count?.enrollments || 0;

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* 1. Breadcrumbs */}
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/courses">Courses</Link> },
          { title: course.title },
        ]}
      />

      {/* 2. Top Banner Header */}
      <div
        style={{
          padding: '32px 36px',
          backgroundColor: token.colorBgContainer,
          borderRadius: 8,
          border: `1px solid ${token.colorBorder}`,
          boxShadow: '1px 1px 0px 0px #262626',
          marginBottom: 32,
        }}
      >
        <Space size="middle" wrap style={{ marginBottom: 12 }}>
          <Tag
            style={{
              textTransform: 'uppercase',
              fontWeight: 700,
              fontSize: 11,
              borderRadius: 9999,
              backgroundColor: '#dcfff1',
              color: '#065f46',
              border: '1px solid #7ee2b8',
            }}
          >
            {course.level}
          </Tag>
          {course.status !== 'published' && (
            <Tag
              style={{
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: 11,
                borderRadius: 9999,
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
              }}
            >
              Draft Preview
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 13 }}>
            Slug: <Text code>{course.slug}</Text>
          </Text>
        </Space>

        <Title level={1} style={{ fontSize: 32, letterSpacing: -0.8, margin: '0 0 14px 0' }}>
          {course.title}
        </Title>

        <Paragraph
          type="secondary"
          style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 840, marginBottom: 20 }}
        >
          {course.description ||
            'Comprehensive vertical curriculum with real-world stacks and architectural deep dives.'}
        </Paragraph>

        {/* Instructor and Stats Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              size={36}
              src={course.users?.avatar_url || undefined}
              icon={<UserOutlined />}
              style={{
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                fontWeight: 700,
              }}
            >
              {instructorName.charAt(0)}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.2 }}>
                {instructorName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {course.users?.teacher_profile?.degree || 'Course Instructor'}
              </Text>
            </div>
          </div>

          <Divider type="vertical" style={{ height: 28 }} />

          <Space size="large" wrap>
            <Space size="small">
              <BookOutlined style={{ color: token.colorTextSecondary }} />
              <Text style={{ fontSize: 13 }}>
                <Text strong>{totalChapters}</Text> Chapters
              </Text>
            </Space>

            <Space size="small">
              <PlayCircleOutlined style={{ color: token.colorTextSecondary }} />
              <Text style={{ fontSize: 13 }}>
                <Text strong>{totalLessons}</Text> Lessons
              </Text>
            </Space>

            <Space size="small">
              <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
              <Text style={{ fontSize: 13 }}>
                <Text strong>{totalDuration}</Text>
              </Text>
            </Space>

            <Space size="small">
              <TeamOutlined style={{ color: token.colorTextSecondary }} />
              <Text style={{ fontSize: 13 }}>
                <Text strong>{enrolledCount}</Text> Enrolled
              </Text>
            </Space>
          </Space>
        </div>
      </div>

      {/* 3. Main Content Split */}
      <Row gutter={[32, 32]}>
        {/* Left Column: Syllabus & Instructor details */}
        <Col xs={24} lg={16}>
          {/* Syllabus Section */}
          <div
            style={{
              padding: '24px 28px',
              backgroundColor: token.colorBgContainer,
              borderRadius: 8,
              border: `1px solid ${token.colorBorder}`,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 20,
              }}
            >
              <Title level={3} style={{ margin: 0, fontSize: 22, letterSpacing: -0.4 }}>
                Curriculum Structure
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {totalChapters} chapters · {totalLessons} lessons
              </Text>
            </div>

            {totalChapters === 0 ? (
              <Empty
                description="Curriculum is currently being drafted by the instructor."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Collapse
                defaultActiveKey={course.chapters.map((c) => c.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${token.colorBorder}`,
                }}
                items={course.chapters.map((chapter, chIdx) => ({
                  key: chapter.id,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: 15 }}>
                        Chapter {chIdx + 1}: {chapter.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {chapter.lessons?.length || 0} lessons
                      </Text>
                    </div>
                  ),
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {chapter.lessons && chapter.lessons.length > 0 ? (
                        chapter.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 4,
                              backgroundColor: token.colorBgLayout,
                              border: `1px solid ${token.colorBorder}`,
                            }}
                          >
                            <Space size="middle">
                              {lesson.lesson_type === 'quiz' ? (
                                <QuestionCircleOutlined
                                  style={{ color: token.colorTextSecondary }}
                                />
                              ) : lesson.lesson_type === 'text' ? (
                                <FileTextOutlined style={{ color: token.colorTextSecondary }} />
                              ) : (
                                <PlayCircleOutlined style={{ color: '#059669' }} />
                              )}
                              <Text style={{ fontSize: 14 }}>
                                {chIdx + 1}.{lIdx + 1} {lesson.title}
                              </Text>
                            </Space>

                            {lesson.duration_seconds ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {Math.ceil(lesson.duration_seconds / 60)} min
                              </Text>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {lesson.lesson_type}
                              </Text>
                            )}
                          </div>
                        ))
                      ) : (
                        <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                          No lessons added to this chapter yet.
                        </Text>
                      )}
                    </div>
                  ),
                }))}
              />
            )}
          </div>

          {/* Instructor Bio Box */}
          <div
            style={{
              padding: '24px 28px',
              backgroundColor: token.colorBgContainer,
              borderRadius: 8,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            <Title level={3} style={{ margin: '0 0 16px 0', fontSize: 22, letterSpacing: -0.4 }}>
              Instructor Profile
            </Title>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <Avatar
                size={54}
                src={course.users?.avatar_url || undefined}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  fontWeight: 700,
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {instructorName.charAt(0)}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>
                  {instructorName}
                </Text>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  {course.users?.teacher_profile?.degree || 'Lead Instructor'}
                  {course.users?.teacher_profile?.expertise
                    ? ` · Specialist in ${course.users.teacher_profile.expertise}`
                    : ''}
                </Text>
                <Paragraph type="secondary" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  {course.users?.teacher_profile?.bio ||
                    'Dedicated instructor committed to building production-grade learning curriculums with practical industry standards.'}
                </Paragraph>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Column: Sticky Pricing & Enrollment Card */}
        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 88 }}>
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                backgroundColor: token.colorBgContainer,
                boxShadow: '2px 2px 0px 0px #262626',
              }}
              styles={{
                body: { padding: 24 },
              }}
            >
              {/* Thumbnail */}
              {course.thumbnail_url && (
                <div
                  style={{
                    height: 180,
                    width: 'calc(100% + 48px)',
                    margin: '-24px -24px 20px -24px',
                    overflow: 'hidden',
                    backgroundColor: '#303030',
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              {/* Price Tag */}
              <div style={{ marginBottom: 16 }}>
                <Text
                  strong
                  style={{
                    fontSize: 28,
                    letterSpacing: -0.5,
                    color: token.colorText,
                    display: 'block',
                  }}
                >
                  {formatPrice(course.price)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  One-time purchase · Full lifetime access
                </Text>
              </div>

              {/* CTA Enroll Button */}
              <Button
                type="primary"
                size="large"
                block
                icon={<PlayCircleOutlined />}
                onClick={handleEnrollClick}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 700,
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: 'var(--shadow-hard)',
                  borderRadius: 4,
                  marginBottom: 16,
                }}
              >
                Enroll In Course
              </Button>

              {/* Checklist */}
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Space size="small">
                  <CheckCircleOutlined style={{ color: '#059669' }} />
                  <Text style={{ fontSize: 13 }}>Full lifetime access to all lessons</Text>
                </Space>
                <Space size="small">
                  <CheckCircleOutlined style={{ color: '#059669' }} />
                  <Text style={{ fontSize: 13 }}>Hands-on exercises & code samples</Text>
                </Space>
                <Space size="small">
                  <SafetyCertificateOutlined style={{ color: '#059669' }} />
                  <Text style={{ fontSize: 13 }}>Official course completion record</Text>
                </Space>
                <Space size="small">
                  <GlobalOutlined style={{ color: '#059669' }} />
                  <Text style={{ fontSize: 13 }}>Self-paced learning on any device</Text>
                </Space>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};
