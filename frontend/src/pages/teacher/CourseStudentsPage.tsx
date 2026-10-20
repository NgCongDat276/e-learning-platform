import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Input,
  Segmented,
  Progress,
  Row,
  Col,
  Card,
  Empty,
  Breadcrumb,
  Skeleton,
  App,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getCourseStudentsApi } from '../../api/enrollment.api';
import type { CourseStudentItem, CourseStudentsResult } from '../../types/enrollment.types';

const { Title, Text, Paragraph } = Typography;

export const CourseStudentsPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<CourseStudentsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Fetch enrolled students roster
  const fetchStudents = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await getCourseStudentsApi(courseId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        message.error(err.response?.data?.message || 'Failed to load enrolled students roster');
      } else {
        message.error('An unexpected error occurred while loading students');
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await Promise.resolve();
      if (!ignore) {
        await fetchStudents();
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [fetchStudents]);

  const students = useMemo(() => data?.students || [], [data]);
  const course = data?.course;

  // Metrics computation
  const metrics = useMemo(() => {
    const total = students.length;
    const completed = students.filter((s) => s.progressPercent === 100).length;
    const inProgress = students.filter((s) => s.progressPercent < 100 && s.completedLessons > 0).length;
    const notStarted = students.filter((s) => s.completedLessons === 0).length;
    const avgProgress =
      total > 0
        ? Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / total)
        : 0;

    return { total, completed, inProgress, notStarted, avgProgress };
  }, [students]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Status filter
    if (statusFilter === 'completed') {
      result = result.filter((s) => s.progressPercent === 100);
    } else if (statusFilter === 'in_progress') {
      result = result.filter((s) => s.progressPercent < 100);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.student.full_name.toLowerCase().includes(q) ||
          s.student.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [students, statusFilter, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0 || !course) {
      message.warning('No student records to export');
      return;
    }

    const headers = [
      'Student ID',
      'Full Name',
      'Email',
      'Enrolled Date',
      'Completed Lessons',
      'Total Lessons',
      'Progress (%)',
      'Status',
    ];
    const rows = students.map((s) => [
      `"${s.student.id}"`,
      `"${s.student.full_name}"`,
      `"${s.student.email}"`,
      `"${new Date(s.enrolledAt).toLocaleDateString('en-US')}"`,
      s.completedLessons,
      s.totalLessons,
      `${s.progressPercent}%`,
      s.progressPercent === 100
        ? 'Completed'
        : s.completedLessons > 0
        ? 'In Progress'
        : 'Not Started',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${course.slug}-students-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('Student roster exported as CSV successfully');
  };

  const columns: ColumnsType<CourseStudentItem> = [
    {
      title: 'Student',
      key: 'student',
      width: 280,
      render: (_, record) => (
        <Space size="middle">
          <Avatar
            size={40}
            src={record.student.avatar_url || undefined}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              border: `1px solid ${token.colorBorder}`,
              fontWeight: 700,
            }}
          >
            {record.student.full_name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
              {record.student.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Enrolled On',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      width: 160,
      sorter: (a, b) => new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime(),
      render: (enrolledAt: string) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
          <Text style={{ fontSize: 13 }}>
            {new Date(enrolledAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Course Progress',
      key: 'progress',
      width: 260,
      sorter: (a, b) => a.progressPercent - b.progressPercent,
      render: (_, record) => {
        const isCompleted = record.progressPercent === 100;
        return (
          <div style={{ width: '100%', maxWidth: 220 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.completedLessons}/{record.totalLessons} lessons
              </Text>
              <Text
                strong
                style={{ fontSize: 12, color: isCompleted ? '#059669' : token.colorText }}
              >
                {record.progressPercent}%
              </Text>
            </div>
            <Progress
              percent={record.progressPercent}
              showInfo={false}
              size="small"
              strokeColor={isCompleted ? '#059669' : token.colorPrimary}
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Not Started', value: 'not_started' },
      ],
      onFilter: (value, record) => {
        if (value === 'completed') return record.progressPercent === 100;
        if (value === 'in_progress')
          return record.progressPercent < 100 && record.completedLessons > 0;
        if (value === 'not_started') return record.completedLessons === 0;
        return true;
      },
      render: (_, record) => {
        if (record.progressPercent === 100) {
          return (
            <Tag
              icon={<CheckCircleFilled />}
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                backgroundColor: '#dcfff1',
                color: '#065f46',
                border: '1px solid #7ee2b8',
              }}
            >
              Completed
            </Tag>
          );
        }
        if (record.completedLessons > 0) {
          return (
            <Tag
              icon={<ClockCircleOutlined />}
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              In Progress
            </Tag>
          );
        }
        return (
          <Tag
            style={{
              borderRadius: 9999,
              fontWeight: 600,
              fontSize: 11,
              backgroundColor: '#f5f5f5',
              color: token.colorTextSecondary,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            Not Started
          </Tag>
        );
      },
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: token.colorBgLayout, // #fcfff7 Cream
        padding: '28px 24px 64px 24px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* Navigation Breadcrumb */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            {
              title: (
                <Link to="/teacher/courses">
                  <Space size={4}>
                    <BookOutlined />
                    <span>Teaching Workspace</span>
                  </Space>
                </Link>
              ),
            },
            {
              title: course?.title || 'Course Details',
            },
            {
              title: 'Enrolled Students',
            },
          ]}
        />

        {/* 1. Header Hero Banner */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: '24px 32px',
            boxShadow: '1px 1px 0px 0px #262626',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Space size="middle" align="center" style={{ marginBottom: 8 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/teacher/courses')}
                style={{ borderRadius: 4 }}
              >
                Back to Courses
              </Button>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                TEACHING ROSTER
              </Tag>
            </Space>

            <Title level={2} style={{ margin: '4px 0 6px 0', fontSize: 26, letterSpacing: -0.5 }}>
              {loading && !course ? 'Loading Course Roster...' : course?.title || 'Enrolled Students'}
            </Title>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 14, maxWidth: 680 }}>
              Track student enrollment progress, monitor lesson completion percentages, and export
              attendance records for this course.
            </Paragraph>
          </div>

          <Space size="middle">
            {course && (
              <Link to={`/teacher/courses/${course.id}/builder`}>
                <Button icon={<UnorderedListOutlined />} style={{ borderRadius: 4, fontWeight: 600 }}>
                  Curriculum Builder
                </Button>
              </Link>
            )}

            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              disabled={students.length === 0}
              style={{
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Export CSV
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => void fetchStudents()}
              loading={loading}
              style={{ borderRadius: 4 }}
            />
          </Space>
        </div>

        {/* 2. Quick Stat Metric Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              bordered
              style={{
                borderRadius: 6,
                borderColor: token.colorBorder,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TeamOutlined style={{ fontSize: 20, color: '#1d4ed8' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Total Enrolled
                  </Text>
                  <Title level={3} style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>
                    {loading ? '...' : metrics.total}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered
              style={{
                borderRadius: 6,
                borderColor: token.colorBorder,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: '#dcfff1',
                    border: '1px solid #7ee2b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrophyOutlined style={{ fontSize: 20, color: '#065f46' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Graduated (100%)
                  </Text>
                  <Title level={3} style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>
                    {loading ? '...' : metrics.completed}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered
              style={{
                borderRadius: 6,
                borderColor: token.colorBorder,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 20, color: '#b45309' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    In Progress
                  </Text>
                  <Title level={3} style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>
                    {loading ? '...' : metrics.inProgress}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              bordered
              style={{
                borderRadius: 6,
                borderColor: token.colorBorder,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: '#f3e8ff',
                    border: '1px solid #e9d5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleFilled style={{ fontSize: 20, color: '#7e22ce' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Avg. Completion
                  </Text>
                  <Title level={3} style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>
                    {loading ? '...' : `${metrics.avgProgress}%`}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Filter & Controls Toolbar */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 20,
            boxShadow: '1px 1px 0px 0px #262626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <Segmented
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as 'all' | 'in_progress' | 'completed')}
            options={[
              { label: `All Students (${metrics.total})`, value: 'all' },
              {
                label: `In Progress (${metrics.inProgress + metrics.notStarted})`,
                value: 'in_progress',
              },
              { label: `Completed (${metrics.completed})`, value: 'completed' },
            ]}
            style={{ fontWeight: 600 }}
          />

          <Space size="middle">
            <Input
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Search student or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: 260, borderRadius: 4 }}
            />
          </Space>
        </div>

        {/* 4. Students Table */}
        <Card
          bordered
          style={{
            borderRadius: 8,
            borderColor: token.colorBorder,
            boxShadow: '1px 1px 0px 0px #262626',
            backgroundColor: token.colorBgContainer,
          }}
          styles={{ body: { padding: 0 } }}
        >
          {loading && students.length === 0 ? (
            <div style={{ padding: '32px' }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            <Table<CourseStudentItem>
              rowKey="enrollmentId"
              columns={columns}
              dataSource={filteredStudents}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchTerm || statusFilter !== 'all' ? (
                        <Text type="secondary">No students match your filter criteria.</Text>
                      ) : (
                        <Space direction="vertical" size={6} style={{ padding: '36px 0' }}>
                          <Text strong style={{ fontSize: 16 }}>
                            No students enrolled yet
                          </Text>
                          <Text type="secondary" style={{ fontSize: 14, maxWidth: 420 }}>
                            When students enroll in this course, their progress metrics and learning
                            activities will appear here.
                          </Text>
                        </Space>
                      )
                    }
                  />
                ),
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
