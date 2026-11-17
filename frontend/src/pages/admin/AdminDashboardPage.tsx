import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Space, Tabs, Typography, theme } from 'antd';
import {
  BarChartOutlined,
  BookOutlined,
  // CheckSquareOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminOverviewStatsApi } from '../../api/admin-stats.api';
import {
  TimeRangeFilterBar,
  type PresetKey,
} from './components/dashboard/TimeRangeFilterBar';
import { StatsKpiGrid } from './components/dashboard/StatsKpiGrid';
import { GrowthTrendChart } from './components/dashboard/GrowthTrendChart';
import { SystemBreakdownCard } from './components/dashboard/SystemBreakdownCard';
import { RecentPendingRequestsCard } from './components/dashboard/RecentPendingRequestsCard';
import { CourseStatsTable } from './components/dashboard/CourseStatsTable';
import { LecturerStatsTable } from './components/dashboard/LecturerStatsTable';
// import { LearningQualityTab } from './components/dashboard/LearningQualityTab';

const { Title, Paragraph } = Typography;

function getPresetRange(preset: Exclude<PresetKey, 'custom'>): [Dayjs, Dayjs] {
  const now = dayjs();
  if (preset === '1d') {
    return [now.startOf('day'), now.endOf('day')];
  }
  if (preset === '7d') {
    return [now.subtract(6, 'day').startOf('day'), now.endOf('day')];
  }
  return [now.subtract(29, 'day').startOf('day'), now.endOf('day')];
}

export const AdminDashboardPage: React.FC = () => {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const [activePreset, setActivePreset] = useState<PresetKey>('30d');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() =>
    getPresetRange('30d')
  );

  const timeRangeQuery = useMemo(
    () => ({
      fromTime: dateRange[0].toISOString(),
      toTime: dateRange[1].toISOString(),
    }),
    [dateRange]
  );

  const {
    data: overviewRes,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
  } = useQuery({
    queryKey: ['admin-stats-overview', timeRangeQuery],
    queryFn: () => getAdminOverviewStatsApi(timeRangeQuery),
  });

  const overview = overviewRes?.data;
  console.log("🚀 ~ AdminDashboardPage ~ overview:", overview)

  const handleSelectPreset = (preset: Exclude<PresetKey, 'custom'>) => {
    setActivePreset(preset);
    setDateRange(getPresetRange(preset));
  };

  const handleChangeRange = (range: [Dayjs, Dayjs]) => {
    setActivePreset('custom');
    setDateRange(range);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-stats-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-stats-courses'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-stats-lecturers'] });
    void queryClient.invalidateQueries({
      queryKey: ['admin-stats-learning-quality'],
    });
  };

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header + Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Space size={10} align="center">
            <BarChartOutlined style={{ fontSize: 24, color: token.colorText }} />
            <Title level={2} style={{ margin: 0 }}>
              Platform Analytics &amp; Overview
            </Title>
          </Space>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
            Track user growth, course performance, enrollments, and learning quality
          </Paragraph>
        </div>

        <TimeRangeFilterBar
          activePreset={activePreset}
          range={dateRange}
          loading={overviewFetching}
          onSelectPreset={handleSelectPreset}
          onChangeRange={handleChangeRange}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Row 1: KPI Cards */}
      <div style={{ marginBottom: 20 }}>
        <StatsKpiGrid kpis={overview?.kpis} loading={overviewLoading} />
      </div>

      {/* Row 2: Trend Chart + Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={16}>
          <GrowthTrendChart
            trend={overview?.trend}
            granularity={overview?.range.granularity}
            loading={overviewLoading}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SystemBreakdownCard kpis={overview?.kpis} loading={overviewLoading} />
        </Col>
      </Row>

      {/* Row 3: Recent Pending Requests */}
      <div style={{ marginBottom: 20 }}>
        <RecentPendingRequestsCard
          requests={overview?.recentPendingRequests}
          loading={overviewLoading}
        />
      </div>

      {/* Row 4: Paginated Detailed Stats Tabs */}
      <Card
        style={{
          borderRadius: 8,
          border: '1px solid #262626',
          boxShadow: '2px 2px 0px 0px #262626',
        }}
        styles={{ body: { padding: '12px 20px 20px 20px' } }}
      >
        <Tabs
          defaultActiveKey="courses"
          items={[
            {
              key: 'courses',
              label: (
                <Space size={6}>
                  <BookOutlined />
                  <span>Course Statistics</span>
                </Space>
              ),
              children: <CourseStatsTable timeRange={timeRangeQuery} />,
            },
            {
              key: 'lecturers',
              label: (
                <Space size={6}>
                  <TeamOutlined />
                  <span>Lecturer Statistics</span>
                </Space>
              ),
              children: <LecturerStatsTable timeRange={timeRangeQuery} />,
            },
            // {
            //   key: 'learning-quality',
            //   label: (
            //     <Space size={6}>
            //       <CheckSquareOutlined />
            //       <span>Chất lượng Quiz &amp; Tiến độ</span>
            //     </Space>
            //   ),
            //   children: <LearningQualityTab timeRange={timeRangeQuery} />,
            // },
          ]}
        />
      </Card>
    </div>
  );
};
