import React from 'react';
import { Card, Col, Row, Skeleton, Tag, Typography, theme } from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { AdminOverviewData } from '../../../../types/admin-stats.types';
import { formatGrowthLabel, formatNumber, formatVnd } from './formatters';

const { Text } = Typography;

interface StatsKpiGridProps {
  kpis?: AdminOverviewData['kpis'];
  loading?: boolean;
}

export const StatsKpiGrid: React.FC<StatsKpiGridProps> = ({ kpis, loading }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const cardStyle: React.CSSProperties = {
    borderRadius: 8,
    border: `1px solid #262626`,
    boxShadow: '2px 2px 0px 0px #262626',
    backgroundColor: token.colorBgContainer,
    height: '100%',
  };

  if (loading || !kpis) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Col key={idx} xs={24} sm={12} lg={8} xl={idx === 4 ? 24 : 6}>
            <Card style={cardStyle}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const renderGrowthTag = (growth: number | null) => {
    const isPositive = growth === null || growth >= 0;
    return (
      <Tag
        style={{
          borderRadius: 9999,
          margin: 0,
          fontWeight: 600,
          border: 'none',
          backgroundColor: isPositive ? '#ecfdf5' : '#fef2f2',
          color: isPositive ? token.colorSuccess : token.colorError,
        }}
      >
        <RiseOutlined style={{ marginRight: 4 }} />
        {formatGrowthLabel(growth)}
      </Tag>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {/* 1. Users */}
      <Col xs={24} sm={12} lg={8} xl={5}>
        <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              <TeamOutlined style={{ marginRight: 6 }} />
              Users
            </Text>
            {renderGrowthTag(kpis.users.growthPercent)}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: token.colorText }}>
            {formatNumber(kpis.users.total)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            +{formatNumber(kpis.users.newInPeriod)} new in period · {kpis.users.byRole.student} Students /{' '}
            {kpis.users.byRole.lecturer} Lecturers
          </Text>
        </Card>
      </Col>

      {/* 2. Courses */}
      <Col xs={24} sm={12} lg={8} xl={5}>
        <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              <BookOutlined style={{ marginRight: 6 }} />
              Courses
            </Text>
            <Tag
              style={{
                borderRadius: 9999,
                margin: 0,
                fontWeight: 600,
                border: 'none',
                backgroundColor: '#f0fdf4',
                color: token.colorSuccess,
              }}
            >
              +{kpis.courses.newInPeriod} new
            </Tag>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: token.colorText }}>
            {formatNumber(kpis.courses.total)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {kpis.courses.byStatus.published} Published · {kpis.courses.byStatus.draft} Draft ·{' '}
            {kpis.courses.byStatus.hidden} Hidden
          </Text>
        </Card>
      </Col>

      {/* 3. Enrollments */}
      <Col xs={24} sm={12} lg={8} xl={5}>
        <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              <UserAddOutlined style={{ marginRight: 6 }} />
              Enrollments
            </Text>
            {renderGrowthTag(kpis.enrollments.growthPercent)}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: token.colorText }}>
            {formatNumber(kpis.enrollments.totalInPeriod)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Total {formatNumber(kpis.enrollments.totalAllTime)} · Completion:{' '}
            <strong>{kpis.enrollments.completionRate}%</strong>
          </Text>
        </Card>
      </Col>

      {/* 4. Estimated Revenue */}
      <Col xs={24} sm={12} lg={12} xl={5}>
        <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              <DollarOutlined style={{ marginRight: 6 }} />
              Est. Revenue
            </Text>
            {renderGrowthTag(kpis.estimatedRevenue.growthPercent)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: token.colorText }}>
            {formatVnd(kpis.estimatedRevenue.inPeriod)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            From {formatNumber(kpis.estimatedRevenue.paidEnrollmentsInPeriod)} paid enrollments
          </Text>
        </Card>
      </Col>

      {/* 5. Pending Actions */}
      <Col xs={24} sm={24} lg={12} xl={4}>
        <Card
          hoverable
          onClick={() => navigate('/admin/users')}
          style={{
            ...cardStyle,
            backgroundColor: kpis.pendingActions.total > 0 ? '#fffbeb' : token.colorBgContainer,
            cursor: 'pointer',
          }}
          styles={{ body: { padding: 18 } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              Pending Actions
            </Text>
            <Tag
              style={{
                borderRadius: 9999,
                margin: 0,
                fontWeight: 600,
                border: 'none',
                backgroundColor: kpis.pendingActions.total > 0 ? token.colorWarning : '#e5e5e5',
                color: kpis.pendingActions.total > 0 ? '#ffffff' : '#262626',
              }}
            >
              Pending
            </Tag>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: token.colorText }}>
            {formatNumber(kpis.pendingActions.total)}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {kpis.pendingActions.lecturerRequests} lecturer requests · {kpis.pendingActions.comments} comments
          </Text>
        </Card>
      </Col>
    </Row>
  );
};
