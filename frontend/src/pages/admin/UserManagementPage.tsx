import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Typography, Space, Badge, theme } from 'antd';
import {
  SafetyOutlined,
  TeamOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { UsersDirectoryTab } from './components/UsersDirectoryTab';
import { LecturerRequestsTab } from './components/LecturerRequestsTab';
import { getLecturerRequestsStatsApi } from '../../api/lecturer-request.api';

const { Title, Paragraph, Text } = Typography;

export const UserManagementPage: React.FC = () => {
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Lấy số lượng đơn pending để hiển thị Badge đỏ
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await getLecturerRequestsStatsApi();
      if (res.success && res.data) {
        setPendingCount(res.data.pending);
      }
    } catch {
      // Bỏ qua lỗi phụ
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const tabItems = [
    {
      key: 'users',
      label: (
        <Space size="small" align="center">
          <TeamOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>All Users</span>
        </Space>
      ),
      children: <UsersDirectoryTab />,
    },
    {
      key: 'lecturer-requests',
      label: (
        <Space size="small" align="center">
          <SolutionOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>Lecturer Applications</span>
          {pendingCount > 0 && (
            <Badge
              count={pendingCount}
              overflowCount={99}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: 'none',
              }}
            />
          )}
        </Space>
      ),
      children: <LecturerRequestsTab onStatsChange={fetchPendingCount} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="horizontal" size="small" style={{ marginBottom: 6 }}>
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
          User Management & Applications
        </Title>
        <Paragraph
          type="secondary"
          style={{
            fontSize: 15,
            marginTop: 6,
            marginBottom: 0,
            maxWidth: 720,
          }}
        >
          Manage platform user accounts, control activation status, and review applications from
          educators applying to become lecturers.
        </Paragraph>
      </div>

      {/* Two-Tab Navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        tabBarStyle={{
          marginBottom: 20,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      />
    </div>
  );
};

export default UserManagementPage;
