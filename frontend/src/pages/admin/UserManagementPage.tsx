import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  Card,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  theme,
  App,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReadOutlined,
  CrownOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/useAuth';
import { getUsersListApi, updateUserStatusApi } from '../../api/user.api';
import type { User, UserRole } from '../../types/auth.types';
import type { UsersListQuery } from '../../types/user.types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const UserManagementPage: React.FC = () => {
  const { token } = theme.useToken();
  const { user: currentUser } = useAuth();
  const { message } = App.useApp();

  // State danh sách người dùng & phân trang
  const [users, setUsers] = useState<User[]>([]);
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
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // State cập nhật trạng thái
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch danh sách người dùng
  const fetchUsers = useCallback(
    async (page = pagination.page, limit = pagination.limit, search = searchKeyword, role = roleFilter) => {
      setLoading(true);
      try {
        const queryParams: UsersListQuery = {
          page,
          limit,
        };

        if (search.trim()) {
          queryParams.search = search.trim();
        }

        if (role !== 'all') {
          queryParams.role = role;
        }

        const res = await getUsersListApi(queryParams);
        if (res.success && res.data) {
          setUsers(res.data);
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
          message.error('Failed to fetch users list');
        }
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchKeyword, roleFilter, message]
  );

  useEffect(() => {
    fetchUsers(1, pagination.limit, searchKeyword, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearch = () => {
    fetchUsers(1, pagination.limit, searchKeyword, roleFilter);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setRoleFilter('all');
    fetchUsers(1, pagination.limit, '', 'all');
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1;
    const newLimit = newPagination.pageSize || 10;
    fetchUsers(newPage, newLimit, searchKeyword, roleFilter);
  };

  const handleToggleStatus = async (userRecord: User) => {
    if (userRecord.id === currentUser?.id) {
      message.warning('You cannot deactivate your own account');
      return;
    }

    const nextStatus = !userRecord.is_active;
    setUpdatingUserId(userRecord.id);

    try {
      const res = await updateUserStatusApi(userRecord.id, nextStatus);
      if (res.success) {
        message.success(
          nextStatus
            ? `User "${userRecord.full_name}" has been activated.`
            : `User "${userRecord.full_name}" has been deactivated.`
        );
        // Cập nhật lại UI tại chỗ
        setUsers((prev) =>
          prev.map((u) => (u.id === userRecord.id ? { ...u, is_active: nextStatus } : u))
        );
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to update user status');
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Thống kê nhanh
  const stats = {
    total: pagination.total,
    active: users.filter((u) => u.is_active).length,
    lecturers: users.filter((u) => u.role === 'lecturer').length,
    students: users.filter((u) => u.role === 'student').length,
  };

  const renderRoleTag = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <Tag
            icon={<CrownOutlined />}
            style={{
              borderRadius: 9999,
              border: `1px solid ${token.colorText}`,
              backgroundColor: '#fef08a',
              color: '#713f12',
              fontWeight: 600,
              padding: '2px 10px',
            }}
          >
            Admin
          </Tag>
        );
      case 'lecturer':
        return (
          <Tag
            icon={<ReadOutlined />}
            style={{
              borderRadius: 9999,
              border: `1px solid ${token.colorText}`,
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              fontWeight: 600,
              padding: '2px 10px',
            }}
          >
            Lecturer
          </Tag>
        );
      case 'student':
      default:
        return (
          <Tag
            icon={<UserOutlined />}
            style={{
              borderRadius: 9999,
              border: `1px solid ${token.colorBorder}`,
              backgroundColor: '#f5f5f5',
              color: token.colorTextSecondary,
              fontWeight: 500,
              padding: '2px 10px',
            }}
          >
            Student
          </Tag>
        );
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User Profile',
      key: 'user',
      render: (_, record) => (
        <Space size="middle" align="center">
          <Avatar
            size={42}
            src={record.avatar_url}
            icon={<UserOutlined />}
            style={{
              backgroundColor: token.colorPrimary,
              color: token.colorText,
              fontWeight: 700,
              border: `1px solid ${token.colorBorder}`,
              boxShadow: '1px 1px 0 0 #262626',
            }}
          >
            {record.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 15, color: token.colorText, display: 'block' }}>
              {record.full_name}
              {record.id === currentUser?.id && (
                <Tag
                  color="default"
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    borderRadius: 9999,
                    border: `1px solid ${token.colorText}`,
                  }}
                >
                  You
                </Tag>
              )}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole) => renderRoleTag(role),
    },
    {
      title: 'Professional Info',
      key: 'teacher_profile',
      width: 220,
      render: (_, record) => {
        if (record.role === 'lecturer' && record.teacher_profile) {
          const { degree, expertise } = record.teacher_profile;
          return (
            <div>
              {degree && (
                <Text strong style={{ fontSize: 13, display: 'block' }}>
                  {degree}
                </Text>
              )}
              {expertise ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {expertise}
                </Text>
              ) : (
                <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                  No expertise specified
                </Text>
              )}
            </div>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12, color: token.colorTextDisabled }}>—</Text>;
      },
    },
    {
      title: 'Joined Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return (
          <Text style={{ fontSize: 13 }}>
            {d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 130,
      render: (isActive: boolean) =>
        isActive ? (
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
            Active
          </Tag>
        ) : (
          <Tag
            icon={<StopOutlined />}
            style={{
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: '1px solid #fca5a5',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Suspended
          </Tag>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id;
        const isUpdating = updatingUserId === record.id;
        const willActivate = !record.is_active;

        if (isSelf) {
          return (
            <Tooltip title="You cannot change the status of your own account">
              <Button size="small" disabled style={{ borderRadius: 4 }}>
                Current User
              </Button>
            </Tooltip>
          );
        }

        return (
          <Popconfirm
            title={willActivate ? 'Activate this account?' : 'Suspend this account?'}
            description={
              willActivate
                ? 'The user will be able to log in and use the platform.'
                : 'The user will be temporarily blocked from signing in.'
            }
            okText={willActivate ? 'Activate' : 'Suspend'}
            cancelText="Cancel"
            okButtonProps={{
              danger: !willActivate,
              style: willActivate
                ? {
                    backgroundColor: token.colorPrimary,
                    color: token.colorText,
                    border: `1px solid ${token.colorText}`,
                    boxShadow: '1px 1px 0 0 #262626',
                  }
                : undefined,
            }}
            onConfirm={() => handleToggleStatus(record)}
          >
            <Button
              size="small"
              loading={isUpdating}
              danger={record.is_active}
              style={{
                borderRadius: 4,
                fontWeight: 600,
                ...(willActivate
                  ? {
                      borderColor: '#059669',
                      color: '#059669',
                    }
                  : {}),
              }}
            >
              {willActivate ? 'Activate' : 'Suspend'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: 28 }}>
        <Space orientation="horizontal" size="small" style={{ marginBottom: 6 }}>
          <SafetyOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
          <Text
            strong
            style={{
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: 12,
              color: token.colorTextSecondary,
            }}
          >
            Admin Console • User Governance
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
          User Management & Access Control
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
          View all registered students, lecturers, and administrators across the platform. Control
          account activation status and manage permissions.
        </Paragraph>
      </div>

      {/* Quick Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Total Accounts
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
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Active in View
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#059669' }}>
                {stats.active}
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
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Lecturers in View
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#4f46e5' }}>
                {stats.lecturers}
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
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Students in View
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: token.colorText }}>
                {stats.students}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filter and Table Container */}
      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: token.colorBorder,
          boxShadow: '2px 2px 0 0 #262626',
          backgroundColor: token.colorBgContainer,
        }}
        bodyStyle={{ padding: 24 }}
      >
        {/* Filter Controls Toolbar */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col xs={24} md={16}>
            <Space wrap size="middle">
              <Input
                placeholder="Search by name or email..."
                prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 280, borderRadius: 4 }}
                allowClear
              />
              <Select
                value={roleFilter}
                onChange={(val) => setRoleFilter(val)}
                style={{ width: 160, borderRadius: 4 }}
              >
                <Option value="all">All Roles</Option>
                <Option value="student">Students</Option>
                <Option value="lecturer">Lecturers</Option>
                <Option value="admin">Admins</Option>
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
              {(searchKeyword || roleFilter !== 'all') && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  style={{ borderRadius: 4 }}
                >
                  Reset
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Displaying <Text strong>{users.length}</Text> of <Text strong>{pagination.total}</Text>{' '}
              accounts
            </Text>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 6,
          }}
        />
      </Card>
    </div>
  );
};
