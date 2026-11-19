import React from 'react';
import { Card, Progress, Skeleton, Space, Typography, theme } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';
import type { AdminOverviewData } from '../../../../types/admin-stats.types';
import { formatNumber } from './formatters';

const { Text, Title } = Typography;

interface SystemBreakdownCardProps {
  kpis?: AdminOverviewData['kpis'];
  loading?: boolean;
}

export const SystemBreakdownCard: React.FC<SystemBreakdownCardProps> = ({
  kpis,
  loading,
}) => {
  const { token } = theme.useToken();

  if (loading || !kpis) {
    return (
      <Card
        style={{
          borderRadius: 8,
          border: '1px solid #262626',
          boxShadow: '2px 2px 0px 0px #262626',
          height: '100%',
        }}
      >
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  const totalUsers = Math.max(kpis.users.total, 1);
  const roleItems = [
    { label: 'Student', value: kpis.users.byRole.student, color: token.colorInfo },
    { label: 'Lecturer', value: kpis.users.byRole.lecturer, color: token.colorSuccess },
    { label: 'Admin', value: kpis.users.byRole.admin, color: token.colorWarning },
  ];

  // SVG Donut calculation
  const size = 112;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = roleItems.reduce<
    Array<{ label: string; color: string; dash: number; offset: number }>
  >((acc, item) => {
    const pct = item.value / totalUsers;
    const dash = pct * circumference;
    const prevSum = acc.reduce((sum, s) => sum + s.dash, 0);
    acc.push({
      label: item.label,
      color: item.color,
      dash,
      offset: -prevSum,
    });
    return acc;
  }, []);

  const totalCourses = Math.max(kpis.courses.total, 1);
  const levels = [
    {
      label: 'Beginner',
      count: kpis.courses.byLevel.beginner,
      color: token.colorSuccess,
    },
    {
      label: 'Intermediate',
      count: kpis.courses.byLevel.intermediate,
      color: token.colorInfo,
    },
    {
      label: 'Advanced',
      count: kpis.courses.byLevel.advanced,
      color: token.colorWarning,
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 8,
        border: '1px solid #262626',
        boxShadow: '2px 2px 0px 0px #262626',
        height: '100%',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Space size={8} style={{ marginBottom: 4 }}>
        <PieChartOutlined style={{ fontSize: 16 }} />
        <Title level={5} style={{ margin: 0 }}>
          System Breakdown
        </Title>
      </Space>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          User role distribution &amp; course levels
        </Text>
      </div>

      {/* Role Donut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={token.colorBorder}
              strokeWidth={14}
            />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={14}
                strokeDasharray={`${seg.dash} ${circumference}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </g>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill={token.colorText}
          >
            {formatNumber(kpis.users.total)}
          </text>
        </svg>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roleItems.map((item) => {
            const pct = ((item.value / totalUsers) * 100).toFixed(1);
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <Space size={6}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text>{item.label}</Text>
                </Space>
                <Text strong>
                  {formatNumber(item.value)} ({pct}%)
                </Text>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course Level Breakdown */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${token.colorBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
          Courses by Level
        </Text>
        {levels.map((lv) => {
          const pct = Math.round((lv.count / totalCourses) * 100);
          return (
            <div key={lv.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 2,
                }}
              >
                <Text>{lv.label}</Text>
                <Text strong>
                  {lv.count} courses ({pct}%)
                </Text>
              </div>
              <Progress
                percent={pct}
                showInfo={false}
                strokeColor={lv.color}
                size="small"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
