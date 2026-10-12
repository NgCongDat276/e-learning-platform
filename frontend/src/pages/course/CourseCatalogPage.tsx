import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Button,
  Tag,
  Pagination,
  Empty,
  Skeleton,
  Avatar,
  Space,
  theme,
  App,
} from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  UserOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getCoursesListApi } from '../../api/course.api';
import type {
  Course,
  CourseLevel,
  CoursesListQuery,
} from '../../types/course.types';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export const CourseCatalogPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const initialSearch = searchParams.get('search') || '';
  const initialLevel = (searchParams.get('level') as CourseLevel) || 'all';
  const initialSort =
    (searchParams.get('sort') as 'latest' | 'oldest' | 'price_asc' | 'price_desc') ||
    'latest';
  const initialPage = Number(searchParams.get('page')) || 1;

  // States
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | 'all'>(initialLevel);
  const [selectedSort, setSelectedSort] = useState<'latest' | 'oldest' | 'price_asc' | 'price_desc'>(
    initialSort
  );
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize] = useState<number>(9);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fallback thumbnails
  const fallbackThumbnails = [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516116211227-bbc13c74a367?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  ];

  // Fetch courses from API
  const fetchCourses = useCallback(
    async (
      page: number,
      search: string,
      level: CourseLevel | 'all',
      sort: 'latest' | 'oldest' | 'price_asc' | 'price_desc'
    ) => {
      setLoading(true);
      try {
        const queryParams: CoursesListQuery = {
          page,
          limit: pageSize,
          sort,
        };

        if (search.trim()) {
          queryParams.search = search.trim();
        }

        if (level !== 'all') {
          queryParams.level = level;
        }

        const res = await getCoursesListApi(queryParams);
        if (res.success && res.data) {
          setCourses(res.data);
          if (res.pagination) {
            setTotalCount(res.pagination.total);
          }
        }
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Failed to load courses catalog');
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize, message]
  );

  // Sync state to URL and fetch
  const triggerSearch = (
    newPage = 1,
    newSearch = searchTerm,
    newLevel = selectedLevel,
    newSort = selectedSort
  ) => {
    setCurrentPage(newPage);
    const nextParams = new URLSearchParams();
    if (newSearch.trim()) nextParams.set('search', newSearch.trim());
    if (newLevel !== 'all') nextParams.set('level', newLevel);
    if (newSort !== 'latest') nextParams.set('sort', newSort);
    if (newPage > 1) nextParams.set('page', String(newPage));
    setSearchParams(nextParams);

    fetchCourses(newPage, newSearch, newLevel, newSort);
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchCourses(currentPage, searchTerm, selectedLevel, selectedSort);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    setSelectedSort('latest');
    setPriceType('all');
    triggerSearch(1, '', 'all', 'latest');
  };

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || price === 0 || price === '0') {
      return 'Free';
    }
    const num = Number(price);
    if (isNaN(num)) return String(price);
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  // Filter client-side for priceType (if chosen)
  const displayedCourses = courses.filter((c) => {
    const p = Number(c.price) || 0;
    if (priceType === 'free') return p === 0;
    if (priceType === 'paid') return p > 0;
    return true;
  });

  const renderLevelBadge = (lvl: CourseLevel) => {
    switch (lvl) {
      case 'advanced':
        return (
          <Tag
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            Advanced
          </Tag>
        );
      case 'intermediate':
        return (
          <Tag
            style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            Intermediate
          </Tag>
        );
      case 'beginner':
      default:
        return (
          <Tag
            style={{
              backgroundColor: '#dcfff1',
              color: '#065f46',
              border: '1px solid #7ee2b8',
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            Beginner
          </Tag>
        );
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* 1. Header Banner */}
      <div
        style={{
          marginBottom: 32,
          padding: '28px 32px',
          backgroundColor: token.colorBgContainer,
          borderRadius: 8,
          border: `1px solid ${token.colorBorder}`,
          boxShadow: '1px 1px 0px 0px #262626',
        }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Tag
            style={{
              backgroundColor: token.colorBgLayout,
              color: token.colorText,
              borderColor: token.colorBorder,
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              padding: '2px 10px',
            }}
          >
            Curriculum Directory
          </Tag>
          <Title level={2} style={{ margin: '4px 0 0 0', letterSpacing: -0.6 }}>
            Explore Verified Engineering Courses
          </Title>
          <Paragraph
            type="secondary"
            style={{ fontSize: 15, margin: 0, maxWidth: 680, lineHeight: 1.5 }}
          >
            Master production-grade stacks with rigorous vertical curricula, architectural
            deep-dives, and hands-on exercises built by certified practitioners.
          </Paragraph>
        </Space>
      </div>

      {/* 2. Search & Filter Bar */}
      <div
        style={{
          marginBottom: 28,
          padding: '20px 24px',
          backgroundColor: token.colorBgContainer,
          borderRadius: 8,
          border: `1px solid ${token.colorBorder}`,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* Keyword Search */}
          <Col xs={24} md={10} lg={8}>
            <Input
              size="middle"
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Search by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={() => triggerSearch(1, searchTerm, selectedLevel, selectedSort)}
              allowClear
              style={{ borderRadius: 4 }}
            />
          </Col>

          {/* Level Filter */}
          <Col xs={12} sm={8} md={5} lg={4}>
            <Select
              style={{ width: '100%', borderRadius: 4 }}
              value={selectedLevel}
              onChange={(val) => {
                setSelectedLevel(val);
                triggerSearch(1, searchTerm, val, selectedSort);
              }}
            >
              <Option value="all">All Levels</Option>
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
            </Select>
          </Col>

          {/* Price Filter */}
          <Col xs={12} sm={8} md={4} lg={4}>
            <Select
              style={{ width: '100%', borderRadius: 4 }}
              value={priceType}
              onChange={(val) => setPriceType(val)}
            >
              <Option value="all">All Pricing</Option>
              <Option value="free">Free Only</Option>
              <Option value="paid">Paid Only</Option>
            </Select>
          </Col>

          {/* Sort Selector */}
          <Col xs={16} sm={8} md={5} lg={5}>
            <Select
              style={{ width: '100%', borderRadius: 4 }}
              value={selectedSort}
              onChange={(val) => {
                setSelectedSort(val);
                triggerSearch(1, searchTerm, selectedLevel, val);
              }}
            >
              <Option value="latest">Sort: Newest First</Option>
              <Option value="oldest">Sort: Oldest First</Option>
              <Option value="price_asc">Price: Low to High</Option>
              <Option value="price_desc">Price: High to Low</Option>
            </Select>
          </Col>

          {/* Action Buttons */}
          <Col xs={8} md={4} lg={3} style={{ textAlign: 'left' }}>
            <Space size="small">
              {/* <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => triggerSearch(1, searchTerm, selectedLevel, selectedSort)}
                style={{
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  fontWeight: 600,
                  boxShadow: '1px 1px 0px 0px #262626',
                  borderRadius: 4,
                }}
              >
                Search
              </Button> */}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                title="Reset Filters"
                style={{ borderRadius: 4 }}
              />
            </Space>
          </Col>
        </Row>

        {/* Counter Strip */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: `1px solid ${token.colorBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
          }}
        >
          <Text type="secondary">
            Showing <Text strong>{displayedCourses.length}</Text> courses (Total available:{' '}
            <Text strong>{totalCount}</Text>)
          </Text>
          {(searchTerm || selectedLevel !== 'all' || priceType !== 'all') && (
            <Tag
              icon={<FilterOutlined />}
              closable
              onClose={handleResetFilters}
              style={{ borderRadius: 9999, margin: 0 }}
            >
              Active Filters Applied
            </Tag>
          )}
        </div>
      </div>

      {/* 3. Courses Grid / Loading / Empty */}
      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card
                style={{
                  borderRadius: 8,
                  borderColor: token.colorBorder,
                  backgroundColor: token.colorBgContainer,
                }}
              >
                <Skeleton.Image style={{ width: '100%', height: 160, marginBottom: 16 }} active />
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : displayedCourses.length === 0 ? (
        <div
          style={{
            padding: '64px 24px',
            backgroundColor: token.colorBgContainer,
            borderRadius: 8,
            border: `1px dashed ${token.colorBorder}`,
            textAlign: 'center',
          }}
        >
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  No courses found matching your criteria
                </Text>
                <Text type="secondary">
                  Try adjusting your keywords, switching levels, or clearing price filters.
                </Text>
              </Space>
            }
          >
            <Button
              type="primary"
              onClick={handleResetFilters}
              style={{
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                border: `1px solid ${token.colorText}`,
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              Clear All Filters
            </Button>
          </Empty>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {displayedCourses.map((course, index) => {
            const thumbnailSrc =
              course.thumbnail_url || fallbackThumbnails[index % fallbackThumbnails.length];
            const instructorName = course.users?.full_name || 'Verified Lecturer';
            const chaptersCount = course._count?.chapters ?? 0;
            const studentsCount = course._count?.enrollments ?? 0;

            return (
              <Col xs={24} sm={12} lg={8} key={course.id}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: 8,
                    borderColor: token.colorBorder,
                    backgroundColor: token.colorBgContainer,
                    display: 'flex',
                    flexDirection: 'column',
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
                    {/* Thumbnail banner */}
                    <div
                      style={{
                        height: 160,
                        width: 'calc(100% + 40px)',
                        margin: '-20px -20px 16px -20px',
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
                          filter: 'brightness(0.95)',
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
                        {renderLevelBadge(course.level)}
                      </div>
                    </div>

                    {/* Course Title */}
                    <Title
                      level={4}
                      style={{
                        fontSize: 17,
                        lineHeight: 1.35,
                        margin: '0 0 8px 0',
                        letterSpacing: -0.3,
                      }}
                    >
                      <Link
                        to={`/courses/${course.slug}`}
                        style={{ color: token.colorText, textDecoration: 'none' }}
                      >
                        {course.title}
                      </Link>
                    </Title>

                    {/* Excerpt */}
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}
                    >
                      {course.description ||
                        'Comprehensive vertical curriculum with real-world stacks and architectural deep dives.'}
                    </Paragraph>

                    {/* Instructor meta */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
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
                          {course.users?.teacher_profile?.degree || 'Course Author'}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
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
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <BookOutlined style={{ marginRight: 4 }} />
                        {chaptersCount} chapters
                        {studentsCount > 0 ? ` · ${studentsCount} enrolled` : ''}
                      </Text>
                    </div>

                    <Link to={`/courses/${course.slug}`}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        style={{
                          fontWeight: 600,
                          borderRadius: 4,
                          backgroundColor: token.colorPrimary,
                          color: token.colorText,
                          border: `1px solid ${token.colorText}`,
                          boxShadow: '1px 1px 0px 0px #262626',
                        }}
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* 4. Pagination */}
      {!loading && totalCount > pageSize && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCount}
            onChange={(newPage) => {
              triggerSearch(newPage, searchTerm, selectedLevel, selectedSort);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};
