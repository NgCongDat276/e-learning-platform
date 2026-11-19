import React from 'react';
import { Card, Col, Empty, Row, Skeleton, Space, Typography, theme } from 'antd';
import { FallOutlined, RiseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminCourseRankingsApi } from '../../../../api/admin-stats.api';
import type { CourseCompletionRankItem } from '../../../../types/admin-stats.types';
import { formatNumber } from './formatters';

const { Text, Title } = Typography;

interface RankListCardProps {
  title: string;
  subtitle: string;
  variant: 'highest' | 'lowest';
  items: CourseCompletionRankItem[];
  loading?: boolean;
  minEnrollments: number;
}

const RankListCard: React.FC<RankListCardProps> = ({
  title,
  subtitle,
  variant,
  items,
  loading,
  minEnrollments,
}) => {
  const { token } = theme.useToken();
  const isHighest = variant === 'highest';

  const getBadgeColors = (index: number) => {
    if (isHighest) {
      return { bg: '#ecfdf5', text: token.colorSuccess, border: '#a7f3d0' };
    }
    if (index < 3) {
      return { bg: '#fef2f2', text: token.colorError, border: '#fecaca' };
    }
    return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
  };

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
      <div style={{ marginBottom: 14 }}>
        <Space size={8} align="center">
          {isHighest ? (
            <RiseOutlined style={{ fontSize: 16, color: token.colorSuccess }} />
          ) : (
            <FallOutlined style={{ fontSize: 16, color: token.colorError }} />
          )}
          <Title level={5} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {subtitle}
          </Text>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No published courses with at least ${minEnrollments} enrollments`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, idx) => {
            const colors = getBadgeColors(idx);
            const isLast = idx === items.length - 1;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '11px 0',
                  borderBottom: isLast ? 'none' : `1px solid ${token.colorBorder}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link
                      to={`/courses/${item.slug}`}
                      style={{
                        color: token.colorText,
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </Link>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatNumber(item.completedEnrollments)}/{formatNumber(item.totalEnrollments)} completed ·{' '}
                      {item.lecturerName}
                    </Text>
                  </div>
                </div>

                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.completionRate.toFixed(1)}%
                </Text>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

interface CourseCompletionRankingsProps {
  minEnrollments?: number;
  limit?: number;
}

export const CourseCompletionRankings: React.FC<
  CourseCompletionRankingsProps
> = ({ minEnrollments = 10, limit = 5 }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats-course-rankings', minEnrollments, limit],
    queryFn: () => getAdminCourseRankingsApi({ minEnrollments, limit }),
  });

  const rankings = data?.data;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <RankListCard
          title="Top Completion Rate"
          subtitle={`Top ${limit} published courses (≥ ${minEnrollments} enrollments)`}
          variant="highest"
          items={rankings?.highest ?? []}
          loading={isLoading}
          minEnrollments={minEnrollments}
        />
      </Col>
      <Col xs={24} lg={12}>
        <RankListCard
          title="Needs Improvement"
          subtitle={`Lowest ${limit} completion rates (≥ ${minEnrollments} enrollments)`}
          variant="lowest"
          items={rankings?.lowest ?? []}
          loading={isLoading}
          minEnrollments={minEnrollments}
        />
      </Col>
    </Row>
  );
};
