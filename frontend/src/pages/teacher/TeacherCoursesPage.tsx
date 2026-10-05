import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Popconfirm,
  Tooltip,
  Image,
  App,
  theme,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  getMyTeachingCoursesApi,
  updateCourseStatusApi,
  deleteCourseApi,
} from '../../api/course.api';
import type {
  Course,
  CourseLevel,
  CourseStatus,
  CoursesListQuery,
} from '../../types/course.types';
import { CourseFormModal } from './components/CourseFormModal';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const TeacherCoursesPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  // State danh sách khóa học & phân trang
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
  }>({
    page: 1,
    limit: 10,
    total: 0,
  });

  // State bộ lọc tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<CourseLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');

  // State điều khiển Modal Tạo/Sửa
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  // State xử lý hành động nhanh
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch danh sách khóa học của giảng viên
  const fetchCourses = useCallback(
    async (
      page = pagination.page,
      limit = pagination.limit,
      search = searchKeyword,
      level = levelFilter,
      status = statusFilter
    ) => {
      setLoading(true);
      try {
        const queryParams: CoursesListQuery = {
          page,
          limit,
        };

        if (search.trim()) {
          queryParams.search = search.trim();
        }

        if (level !== 'all') {
          queryParams.level = level;
        }

        if (status !== 'all') {
          queryParams.status = status;
        }

        const res = await getMyTeachingCoursesApi(queryParams);
        if (res.success && res.data) {
          setCourses(res.data);
          if (res.pagination) {
            setPagination({
              page: res.pagination.page,
              limit: res.pagination.limit,
              total: res.pagination.total,
            });
          }
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Failed to fetch teaching courses');
        }
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchKeyword, levelFilter, statusFilter, message]
  );

  useEffect(() => {
    fetchCourses(1, pagination.limit, searchKeyword, levelFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, statusFilter]);

  const handleSearch = () => {
    fetchCourses(1, pagination.limit, searchKeyword, levelFilter, statusFilter);
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setLevelFilter('all');
    setStatusFilter('all');
    fetchCourses(1, pagination.limit, '', 'all', 'all');
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1;
    const newLimit = newPagination.pageSize || 10;
    fetchCourses(newPage, newLimit, searchKeyword, levelFilter, statusFilter);
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setCourseToEdit(null);
    setModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (course: Course) => {
    setCourseToEdit(course);
    setModalOpen(true);
  };

  // Callback sau khi tạo hoặc sửa thành công
  const handleModalSuccess = (savedCourse: Course) => {
    if (courseToEdit) {
      setCourses((prev) =>
        prev.map((c) => (c.id === savedCourse.id ? { ...c, ...savedCourse } : c))
      );
    } else {
      fetchCourses(1, pagination.limit, searchKeyword, levelFilter, statusFilter);
    }
  };

  // Bật/tắt trạng thái xuất bản (Published <-> Draft)
  const handleToggleStatus = async (course: Course) => {
    const nextStatus: CourseStatus =
      course.status === 'published' ? 'draft' : 'published';
    setActionLoadingId(course.id);

    try {
      const res = await updateCourseStatusApi(course.id, { status: nextStatus });
      if (res.success) {
        message.success(
          nextStatus === 'published'
            ? `Course "${course.title}" has been published!`
            : `Course "${course.title}" moved to draft.`
        );
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to change course status');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xóa khóa học
  const handleDeleteCourse = async (course: Course) => {
    setActionLoadingId(course.id);
    try {
      const res = await deleteCourseApi(course.id);
      if (res.success) {
        message.success(`Course "${course.title}" was deleted.`);
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to delete course');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Thống kê nhanh
  const stats = {
    total: pagination.total,
    published: courses.filter((c) => c.status === 'published').length,
    drafts: courses.filter((c) => c.status === 'draft').length,
    students: courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0),
  };

  const renderStatusTag = (status: CourseStatus) => {
    switch (status) {
      case 'published':
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            style={{
              backgroundColor: '#dcfff1',
              color: '#059669',
              border: '1px solid #7ee2b8',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Published
          </Tag>
        );
      case 'hidden':
        return (
          <Tag
            icon={<StopOutlined />}
            style={{
              backgroundColor: '#f5f5f5',
              color: token.colorTextSecondary,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 9999,
              fontWeight: 500,
              padding: '2px 8px',
            }}
          >
            Hidden
          </Tag>
        );
      case 'draft':
      default:
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Draft
          </Tag>
        );
    }
  };

  const renderLevelTag = (level: CourseLevel) => {
    switch (level) {
      case 'advanced':
        return <Tag color="purple">Advanced</Tag>;
      case 'intermediate':
        return <Tag color="blue">Intermediate</Tag>;
      case 'beginner':
      default:
        return <Tag color="green">Beginner</Tag>;
    }
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'Course Overview',
      key: 'course',
      render: (_, record) => (
        <Space size="middle" align="start">
          {record.thumbnail_url ? (
            <Image
              src={record.thumbnail_url}
              alt={record.title}
              width={100}
              height={60}
              style={{
                objectFit: 'cover',
                borderRadius: 4,
                border: `1px solid ${token.colorBorder}`,
              }}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'%3E%3Crect width='100' height='60' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%23999' dominant-baseline='middle' text-anchor='middle'%3ENo Cover%3C/text%3E%3C/svg%3E"
              preview={false}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 60,
                borderRadius: 4,
                backgroundColor: '#f5f5f5',
                border: `1px solid ${token.colorBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOutlined style={{ fontSize: 24, color: token.colorTextSecondary }} />
            </div>
          )}
          <div>
            <Text strong style={{ fontSize: 15, color: token.colorText, display: 'block' }}>
              {record.title}
            </Text>
            <Space size="small" style={{ marginTop: 4 }}>
              {renderLevelTag(record.level)}
              <Text type="secondary" style={{ fontSize: 12 }}>
                slug: <Text code>{record.slug}</Text>
              </Text>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      render: (price: number | string) => {
        const numPrice = Number(price);
        if (numPrice === 0) {
          return (
            <Tag color="cyan" style={{ borderRadius: 9999, fontWeight: 600 }}>
              Free
            </Tag>
          );
        }
        return (
          <Text strong style={{ fontSize: 14 }}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(numPrice)}
          </Text>
        );
      },
    },
    {
      title: 'Curriculum & Students',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size="small">
            <BookOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ fontSize: 13 }}>
              <Text strong>{record._count?.chapters || 0}</Text> chapters
            </Text>
          </Space>
          <Space size="small">
            <TeamOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ fontSize: 13 }}>
              <Text strong>{record._count?.enrollments || 0}</Text> students
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: CourseStatus) => renderStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => {
        const isActionLoading = actionLoadingId === record.id;
        const willPublish = record.status !== 'published';

        return (
          <Space size="small">
            {/* View live/preview */}
            <Tooltip title="Preview Course Page">
              <Link to={`/courses/${record.slug}`} target="_blank">
                <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 4 }} />
              </Link>
            </Tooltip>

            {/* Curriculum Builder */}
            <Tooltip title="Curriculum Builder (Chapters & Lessons)">
              <Link to={`/teacher/courses/${record.id}/builder`}>
                <Button size="small" icon={<UnorderedListOutlined />} style={{ borderRadius: 4 }} />
              </Link>
            </Tooltip>

            {/* Edit details */}
            <Tooltip title="Edit Course Details">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEditModal(record)}
                style={{ borderRadius: 4 }}
              />
            </Tooltip>

            {/* Toggle Published / Draft */}
            <Popconfirm
              title={willPublish ? 'Publish this course?' : 'Move course to draft?'}
              description={
                willPublish
                  ? 'Students will be able to discover and enroll in this course.'
                  : 'The course will be hidden from the public catalog.'
              }
              okText={willPublish ? 'Publish' : 'Draft'}
              cancelText="Cancel"
              okButtonProps={{
                style: willPublish
                  ? {
                      backgroundColor: token.colorPrimary,
                      color: token.colorText,
                      border: `1px solid ${token.colorText}`,
                    }
                  : undefined,
              }}
              onConfirm={() => handleToggleStatus(record)}
            >
              <Tooltip title={willPublish ? 'Publish to Catalog' : 'Unpublish to Draft'}>
                <Button
                  size="small"
                  loading={isActionLoading}
                  icon={willPublish ? <GlobalOutlined /> : <ClockCircleOutlined />}
                  style={{
                    borderRadius: 4,
                    borderColor: willPublish ? '#059669' : undefined,
                    color: willPublish ? '#059669' : undefined,
                  }}
                />
              </Tooltip>
            </Popconfirm>

            {/* Delete Course */}
            <Popconfirm
              title="Delete this course?"
              description="This action cannot be undone. Only courses with 0 enrollments can be deleted."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteCourse(record)}
            >
              <Tooltip title="Delete Course">
                <Button
                  size="small"
                  danger
                  loading={isActionLoading}
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 4 }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const renderEmptyState = () => {
    const isFiltered = searchKeyword.trim() !== '' || levelFilter !== 'all' || statusFilter !== 'all';
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: '#f5f5f5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            border: `1px solid ${token.colorBorder}`,
          }}
        >
          <BookOutlined style={{ fontSize: 28, color: token.colorTextSecondary }} />
        </div>
        <Title level={4} style={{ margin: '0 0 8px', color: token.colorText }}>
          {isFiltered ? 'No courses match your filters' : 'No courses created yet'}
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 420, margin: '0 auto 16px' }}>
          {isFiltered
            ? 'Try adjusting your search keyword or changing the level and status filters.'
            : 'Start building your curriculum today. Create your first course to begin teaching students.'}
        </Paragraph>
        {isFiltered ? (
          <Button onClick={handleResetFilters} style={{ borderRadius: 4 }}>
            Clear All Filters
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            style={{
              backgroundColor: token.colorPrimary,
              color: token.colorText,
              border: `1px solid ${token.colorText}`,
              borderRadius: 4,
              fontWeight: 600,
              boxShadow: '2px 2px 0 0 #262626',
            }}
          >
            Create First Course
          </Button>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <Space direction="horizontal" size="small" style={{ marginBottom: 6 }}>
            <BookOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
            <Text
              strong
              style={{
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: 12,
                color: token.colorTextSecondary,
              }}
            >
              Teacher Portal • Curriculum Studio
            </Text>
          </Space>
          <Title
            level={2}
            style={{
              margin: 0,
              fontSize: 32,
              letterSpacing: -0.5,
              color: token.colorText,
            }}
          >
            My Teaching Courses
          </Title>
          <Paragraph
            type="secondary"
            style={{
              fontSize: 15,
              marginTop: 6,
              marginBottom: 0,
              maxWidth: 700,
            }}
          >
            Create, manage, and publish your educational courses. Organize chapters, track enrolled
            learners, and fine-tune your syllabus.
          </Paragraph>
        </div>

        {/* Primary CTA: Create Course */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorText,
            border: `1px solid ${token.colorText}`,
            borderRadius: 4,
            fontWeight: 700,
            boxShadow: '2px 2px 0 0 #262626',
            height: 44,
            padding: '0 20px',
          }}
        >
          Create New Course
        </Button>
      </div>

      {/* Metric Counters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Total Courses
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: token.colorText }}>
                {stats.total}
              </Title>
            </Space>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Published in View
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#059669' }}>
                {stats.published}
              </Title>
            </Space>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Drafts in View
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#b45309' }}>
                {stats.drafts}
              </Title>
            </Space>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Total Learners
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#4f46e5' }}>
                {stats.students}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: token.colorBorder,
          boxShadow: '2px 2px 0 0 #262626',
          backgroundColor: token.colorBgContainer,
        }}
        styles={{ body: { padding: 24 } }}
      >
        {/* Filters Toolbar */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col xs={24} lg={18}>
            <Space wrap size="middle">
              <Input
                placeholder="Search course title or description..."
                prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 280, borderRadius: 4 }}
                allowClear
              />

              <Select
                value={levelFilter}
                onChange={(val) => setLevelFilter(val)}
                style={{ width: 150, borderRadius: 4 }}
              >
                <Option value="all">All Levels</Option>
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 140, borderRadius: 4 }}
              >
                <Option value="all">All Statuses</Option>
                <Option value="published">Published</Option>
                <Option value="draft">Draft</Option>
                <Option value="hidden">Hidden</Option>
              </Select>

              <Button
                type="primary"
                onClick={handleSearch}
                style={{
                  borderRadius: 4,
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: '1px 1px 0 0 #262626',
                  fontWeight: 600,
                }}
              >
                Filter
              </Button>

              {(searchKeyword || levelFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  style={{ borderRadius: 4 }}
                >
                  Reset
                </Button>
              )}
            </Space>
          </Col>

          <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Showing <Text strong>{courses.length}</Text> of <Text strong>{pagination.total}</Text>{' '}
              courses
            </Text>
          </Col>
        </Row>

        {/* Courses Table */}
        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: renderEmptyState() }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} courses`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 6,
          }}
        />
      </Card>

      {/* Modal Tạo & Sửa khóa học */}
      <CourseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        courseToEdit={courseToEdit}
      />
    </div>
  );
};
