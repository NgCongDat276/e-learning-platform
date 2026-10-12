import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Tag, Button, Row, Col, Avatar, Skeleton, Empty, theme } from 'antd';
import { PlayCircleOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import type { Course } from '../../../types/course.types';
import { CURATED_COURSES } from '../data/home.data';

const { Title, Paragraph, Text } = Typography;

interface FeaturedCurriculaProps {
  backendCourses?: Course[];
  loading?: boolean;
}

export const FeaturedCurricula: React.FC<FeaturedCurriculaProps> = ({
  backendCourses = [],
  loading = false,
}) => {
  const { token } = theme.useToken();
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Prioritize real database courses if available
  const hasRealCourses = backendCourses && backendCourses.length > 0;

  // Filter real courses by level if available
  const filteredRealCourses = backendCourses.filter((course) => {
    if (selectedLevel === 'All') return true;
    return course.level?.toLowerCase() === selectedLevel.toLowerCase();
  });

  // Fallback to curated mock if DB has no courses at all
  const filteredCurated = CURATED_COURSES.filter((c) => {
    if (selectedLevel === 'All') return true;
    return c.level.toLowerCase() === selectedLevel.toLowerCase();
  });

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || price === 0 || price === '0') {
      return 'Free';
    }
    const num = Number(price);
    if (isNaN(num)) return String(price);
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  const getFallbackThumbnail = (index: number) => {
    const fallbacks = [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516116211227-bbc13c74a367?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <section id="curricula" style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Tag
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                backgroundColor: token.colorBgLayout,
                borderColor: token.colorBorder,
              }}
            >
              Curated Directory
            </Tag>
            {hasRealCourses && (
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 11,
                  backgroundColor: '#dcfff1',
                  color: '#065f46',
                  borderColor: '#7ee2b8',
                }}
              >
                ● Live Database: {backendCourses.length} Courses
              </Tag>
            )}
          </div>
          <Title level={2} style={{ margin: 0, fontSize: 32, letterSpacing: -0.8 }}>
            Production-Grade Curricula & Deep Dives
          </Title>
          <Text type="secondary" style={{ fontSize: 15, marginTop: 4, display: 'block' }}>
            Rigorous vertical slices built with real-world stacks. Zero toy examples.
          </Text>
        </div>

        {/* Level Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {levels.map((lvl) => {
            const active = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: active ? `1px solid ${token.colorText}` : `1px solid ${token.colorBorder}`,
                  backgroundColor: active ? token.colorPrimary : token.colorBgContainer,
                  color: token.colorText,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: active ? '2px 2px 0 0 #262626' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {lvl === 'All' ? 'All Levels' : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <Col xs={24} md={12} lg={8} key={k}>
              <Card style={{ borderRadius: token.borderRadiusLG }}>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : hasRealCourses ? (
        /* Real Courses from PostgreSQL Database */
        filteredRealCourses.length === 0 ? (
          <Empty description={`No courses found for level ${selectedLevel}`} style={{ padding: '48px 0' }} />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredRealCourses.map((course, idx) => {
              const levelStr = course.level?.toUpperCase() || 'BEGINNER';
              const isAdvanced = course.level === 'advanced';
              const isIntermediate = course.level === 'intermediate';
              const instructorName = course.users?.full_name || 'Edutech Instructor';
              const chaptersCount = course._count?.chapters ?? 0;
              const enrollmentsCount = course._count?.enrollments ?? 0;
              const thumbnailSrc = course.thumbnail_url || getFallbackThumbnail(idx);

              return (
                <Col xs={24} md={12} lg={8} key={course.id}>
                  <Card
                    className="card-hard-shadow"
                    style={{
                      backgroundColor: token.colorBgContainer,
                      borderColor: token.colorBorder,
                      borderRadius: token.borderRadiusLG,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                    styles={{
                      body: {
                        padding: '20px 22px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      },
                    }}
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div
                        style={{
                          height: 160,
                          width: 'calc(100% + 44px)',
                          margin: '-20px -22px 16px -22px',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#303030',
                        }}
                      >
                        <img
                          src={thumbnailSrc}
                          alt={course.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'brightness(0.92)',
                            transition: 'transform 0.3s ease',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'flex',
                            gap: 6,
                          }}
                        >
                          <Tag
                            style={{
                              borderRadius: 9999,
                              fontWeight: 700,
                              fontSize: 11,
                              backgroundColor:
                                isAdvanced ? '#fee2e2' : isIntermediate ? '#fef3c7' : '#dcfff1',
                              color:
                                isAdvanced ? '#991b1b' : isIntermediate ? '#92400e' : '#065f46',
                              border: '1px solid rgba(0,0,0,0.1)',
                            }}
                          >
                            {levelStr}
                          </Tag>
                          {course.status && (
                            <Tag
                              style={{
                                borderRadius: 9999,
                                fontWeight: 600,
                                fontSize: 11,
                                backgroundColor: '#ffffff',
                                color: '#262626',
                                border: '1px solid #262626',
                              }}
                            >
                              {course.status.toUpperCase()}
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* Course Title & Excerpt */}
                      <Title
                        level={4}
                        style={{ fontSize: 18, lineHeight: 1.35, margin: '0 0 8px 0', letterSpacing: -0.4 }}
                      >
                        {course.title}
                      </Title>
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}
                      >
                        {course.description || 'Comprehensive curriculum with hands-on exercises and architecture.'}
                      </Paragraph>

                      {/* Instructor Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <Avatar
                          size={28}
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
                          <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                            {instructorName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {course.users?.teacher_profile?.degree || 'Verified Instructor'}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Footer Strip */}
                    <div
                      style={{
                        borderTop: `1px solid ${token.colorBorder}`,
                        paddingTop: 14,
                        marginTop: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <Text strong style={{ fontSize: 18, color: token.colorText, display: 'block' }}>
                          {formatPrice(course.price)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <BookOutlined style={{ marginRight: 4 }} />
                          {chaptersCount} chapters {enrollmentsCount > 0 ? `· ${enrollmentsCount} enrolled` : ''}
                        </Text>
                      </div>

                      <Link to={`/courses/${course.slug}`}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlayCircleOutlined />}
                          style={{
                            fontWeight: 600,
                            borderRadius: token.borderRadius,
                            boxShadow: 'var(--shadow-hard)',
                          }}
                        >
                          View Syllabus
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )
      ) : (
        /* Fallback to curated mock if database has 0 courses */
        <Row gutter={[24, 24]}>
          {filteredCurated.map((course) => (
            <Col xs={24} md={12} lg={8} key={course.id}>
              <Card
                className="card-hard-shadow"
                style={{
                  backgroundColor: token.colorBgContainer,
                  borderColor: token.colorBorder,
                  borderRadius: token.borderRadiusLG,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                styles={{
                  body: {
                    padding: '20px 22px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  },
                }}
              >
                <div>
                  <div
                    style={{
                      height: 160,
                      width: 'calc(100% + 44px)',
                      margin: '-20px -22px 16px -22px',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#303030',
                    }}
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.92)',
                      }}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Tag
                        style={{
                          borderRadius: 9999,
                          fontWeight: 700,
                          fontSize: 11,
                          backgroundColor: '#ffffff',
                          color: '#262626',
                          border: '1px solid #262626',
                        }}
                      >
                        {course.category}
                      </Tag>
                    </div>
                  </div>

                  <Title level={4} style={{ fontSize: 18, lineHeight: 1.35, margin: '0 0 8px 0' }}>
                    {course.title}
                  </Title>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 14 }}>
                    {course.description}
                  </Paragraph>
                </div>

                <div
                  style={{
                    borderTop: `1px solid ${token.colorBorder}`,
                    paddingTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text strong style={{ fontSize: 18 }}>
                    {course.price}
                  </Text>
                  <Link to={`/courses/${course.slug}`}>
                    <Button type="primary" size="small" icon={<PlayCircleOutlined />} style={{ fontWeight: 600 }}>
                      View Syllabus
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Bottom CTA to Full Catalog */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link to="/courses">
          <Button
            size="large"
            icon={<BookOutlined />}
            style={{
              height: 48,
              padding: '0 32px',
              fontWeight: 600,
              fontSize: 15,
              borderRadius: token.borderRadius,
              boxShadow: '1px 1px 0px 0px #262626',
            }}
          >
            Browse All Courses in Catalog →
          </Button>
        </Link>
      </div>
    </section>
  );
};
