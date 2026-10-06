import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Tag, Dropdown, Avatar, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  BookOutlined,
  UserAddOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../context/useAuth';

const { Text } = Typography;

export const HomeHeader: React.FC = () => {
  const { token } = theme.useToken();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isLecturer = user?.role?.toLowerCase() === 'lecturer';

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '6px 4px' }}>
          <Text strong style={{ display: 'block', color: token.colorText, fontSize: 14 }}>
            {user?.full_name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
          {user?.lecturer_request?.status === 'pending' && (
            <div style={{ marginTop: 6 }}>
              <Tag
                style={{
                  fontSize: 10,
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  borderColor: '#fcd34d',
                  borderRadius: 9999,
                }}
              >
                Applicant Pending
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Account Settings</Link>,
    },
    ...(isAdmin
      ? [
          {
            key: 'admin-users',
            icon: <TeamOutlined />,
            label: <Link to="/admin/users">User Management</Link>,
          },
        ]
      : []),
    ...(isLecturer
      ? [
          {
            key: 'teacher-courses',
            icon: <DashboardOutlined />,
            label: <Link to="/teacher/courses">Teaching Workspace</Link>,
          },
        ]
      : [
          {
            key: 'courses',
            icon: <DashboardOutlined />,
            label: <Link to="/courses">My Enrolled Courses</Link>,
          },
        ]),
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        borderBottom: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Brand Logo & Platform Badge */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 34,
              height: 34,
              backgroundColor: token.colorText,
              borderRadius: token.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <BookOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <Text strong style={{ fontSize: 20, letterSpacing: -0.6, color: token.colorText }}>
              EDUTECH
            </Text>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                padding: '2px 6px',
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorText}`,
              }}
            >
              LMS
            </span>
          </div>
        </Link>

        {/* Editorial Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
          }}
          className="hidden-mobile"
        >
          <a
            href="#curricula"
            style={{
              color: token.colorText,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Curricula
          </a>
          <a
            href="#methodology"
            style={{
              color: token.colorText,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Methodology
          </a>
          <a
            href="#interactive-demo"
            style={{
              color: token.colorText,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Interactive Canvas
          </a>
          <a
            href="#teach-with-us"
            style={{
              color: token.colorText,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Teach with Us
          </a>
          <a
            href="#faq"
            style={{
              color: token.colorText,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            FAQ
          </a>
        </nav>

        {/* Right Action / Auth Buttons */}
        <div>
          {isAuthenticated && user ? (
            <Space size="middle" align="center">
              <Tag
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 9999,
                  backgroundColor: isAdmin ? '#fef08a' : isLecturer ? '#e0e7ff' : token.colorBgLayout,
                  borderColor: isAdmin ? '#ca8a04' : isLecturer ? '#a5b4fc' : token.colorBorder,
                  color: isAdmin ? '#713f12' : isLecturer ? '#3730a3' : token.colorText,
                  padding: '2px 10px',
                }}
              >
                {user.role}
              </Tag>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorder}`,
                    backgroundColor: token.colorBgContainer,
                    boxShadow: 'var(--shadow-hard)',
                  }}
                >
                  <Avatar
                    style={{
                      backgroundColor: token.colorPrimary,
                      color: token.colorText,
                      fontWeight: 700,
                    }}
                    size="small"
                    src={user.avatar_url || undefined}
                  >
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Text strong style={{ fontSize: 14 }}>
                    {user.full_name}
                  </Text>
                </div>
              </Dropdown>
            </Space>
          ) : (
            <Space size="small">
              <Link to="/login">
                <Button
                  size="middle"
                  style={{
                    fontWeight: 600,
                    borderRadius: token.borderRadius,
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  type="primary"
                  size="middle"
                  icon={<UserAddOutlined />}
                  style={{
                    fontWeight: 600,
                    borderRadius: token.borderRadius,
                    boxShadow: 'var(--shadow-hard)',
                  }}
                >
                  Get Started Free
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </div>
    </header>
  );
};
