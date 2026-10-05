import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Space, Tag, Dropdown, Avatar, theme, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/useAuth';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const { token } = theme.useToken();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isLecturer = user?.role?.toLowerCase() === 'lecturer';

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-header',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block', color: token.colorText }}>
            {user?.full_name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
          {user?.role && (
            <div style={{ marginTop: 4 }}>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  border: `1px solid ${token.colorBorder}`,
                  backgroundColor: isAdmin
                    ? '#fef08a'
                    : isLecturer
                    ? '#e0e7ff'
                    : '#f5f5f5',
                  color: isAdmin
                    ? '#713f12'
                    : isLecturer
                    ? '#3730a3'
                    : token.colorTextSecondary,
                }}
              >
                {user.role}
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
      label: <Link to="/profile">My Profile</Link>,
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
      : !isAdmin
      ? [
          {
            key: 'courses',
            icon: <DashboardOutlined />,
            label: <Link to="/courses">My Courses</Link>,
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  const navMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <AppstoreOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: <Link to="/courses">Courses</Link>,
    },
    ...(isLecturer
      ? [
          {
            key: '/teacher/courses',
            icon: <DashboardOutlined />,
            label: <Link to="/teacher/courses">Teaching Workspace</Link>,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: <Link to="/admin/users">User Management</Link>,
          },
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      {/* Top Header */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Space size="large" align="center">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Space size="small" align="center">
              <BookOutlined style={{ fontSize: 22, color: token.colorText }} />
              <Text strong style={{ fontSize: 17, letterSpacing: -0.5, color: token.colorText }}>
                EDUTECH{' '}
                <span
                  style={{
                    color: token.colorPrimary,
                    background: token.colorText,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  LMS
                </span>
              </Text>
            </Space>
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={navMenuItems}
            style={{
              borderBottom: 'none',
              backgroundColor: 'transparent',
              minWidth: 380,
            }}
          />
        </Space>

        {/* User Dropdown */}
        <Space size="middle" align="center">
          <Tag
            style={{
              textTransform: 'uppercase',
              fontWeight: 600,
              fontSize: 11,
              borderRadius: 9999,
              backgroundColor: token.colorBgLayout,
              borderColor: token.colorBorder,
            }}
          >
            {user?.role}
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
                boxShadow: '1px 1px 0px 0px #262626',
              }}
            >
              <Avatar
                style={{
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  fontWeight: 700,
                }}
                src={user?.avatar_url || undefined}
                size="small"
              >
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Text strong style={{ fontSize: 13 }}>
                {user?.full_name}
              </Text>
            </div>
          </Dropdown>
        </Space>
      </Header>

      {/* Main Body */}
      <Content
        style={{
          maxWidth: 1160,
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          flex: 1,
        }}
      >
        <Outlet />
      </Content>

      {/* Footer */}
      <Footer
        style={{
          textAlign: 'center',
          backgroundColor: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorder}`,
          padding: '20px 24px',
          color: token.colorTextSecondary,
          fontSize: 13,
        }}
      >
        <Text type="secondary">
          EDUTECH LMS © 2026. Editorial Broadsheet Design System & Ant Design Tokens.
        </Text>
      </Footer>
    </Layout>
  );
};
