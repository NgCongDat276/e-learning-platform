import React, { useState } from 'react';
import { Card, Empty, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import type {
  AdminOverviewData,
  StatsGranularity,
} from '../../../../types/admin-stats.types';
import { formatNumber, formatVnd } from './formatters';

const { Text, Title } = Typography;

interface GrowthTrendChartProps {
  trend?: AdminOverviewData['trend'];
  granularity?: StatsGranularity;
  loading?: boolean;
}

const GRANULARITY_LABEL: Record<StatsGranularity, string> = {
  hour: 'Hourly',
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

export const GrowthTrendChart: React.FC<GrowthTrendChartProps> = ({
  trend = [],
  granularity = 'day',
  loading,
}) => {
  const { token } = theme.useToken();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 680;
  const height = 240;
  const pad = { top: 18, right: 20, bottom: 32, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxVal = Math.max(
    1,
    ...trend.map((d) => Math.max(d.newEnrollments, d.newUsers))
  );
  const yMax = Math.ceil(maxVal * 1.15);

  const getX = (i: number) =>
    trend.length > 1
      ? pad.left + (i / (trend.length - 1)) * plotW
      : pad.left + plotW / 2;

  const getY = (val: number) => pad.top + plotH - (val / yMax) * plotH;

  const buildPath = (getter: (item: AdminOverviewData['trend'][number]) => number) =>
    trend
      .map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(getter(item))}`)
      .join(' ');

  const enrollmentsPath = buildPath((d) => d.newEnrollments);
  const usersPath = buildPath((d) => d.newUsers);

  const labelStep = Math.max(1, Math.ceil(trend.length / 7));
  const hovered = hoverIdx !== null ? trend[hoverIdx] : null;

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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <Space size={8}>
            <LineChartOutlined style={{ fontSize: 16, color: token.colorText }} />
            <Title level={5} style={{ margin: 0 }}>
              Growth Trend
            </Title>
            <Tag
              style={{
                borderRadius: 9999,
                border: '1px solid #262626',
                backgroundColor: '#fcfff7',
                color: '#262626',
                fontWeight: 500,
              }}
            >
              {GRANULARITY_LABEL[granularity]}
            </Tag>
          </Space>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              New enrollments vs. new users over time
            </Text>
          </div>
        </div>

        <Space size={16}>
          <Space size={6}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: token.colorInfo,
              }}
            />
            <Text style={{ fontSize: 12 }}>New Enrollments</Text>
          </Space>
          <Space size={6}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: token.colorSuccess,
              }}
            />
            <Text style={{ fontSize: 12 }}>New Users</Text>
          </Space>
        </Space>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : trend.length === 0 ? (
        <Empty description="No data available for the selected range" />
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 240, overflow: 'visible' }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = pad.top + plotH * (1 - ratio);
              const val = Math.round(yMax * ratio);
              return (
                <g key={idx}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke={token.colorBorder}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={11}
                    fill={token.colorTextSecondary}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Lines */}
            <path
              d={enrollmentsPath}
              fill="none"
              stroke={token.colorInfo}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <path
              d={usersPath}
              fill="none"
              stroke={token.colorSuccess}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {/* Hover vertical guide */}
            {hoverIdx !== null && (
              <line
                x1={getX(hoverIdx)}
                y1={pad.top}
                x2={getX(hoverIdx)}
                y2={pad.top + plotH}
                stroke="#262626"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            )}

            {/* Data points & X labels */}
            {trend.map((item, idx) => {
              const cx = getX(idx);
              const showLabel = idx % labelStep === 0 || idx === trend.length - 1;
              const isHovered = hoverIdx === idx;
              return (
                <g key={item.bucket}>
                  <circle
                    cx={cx}
                    cy={getY(item.newEnrollments)}
                    r={isHovered ? 5 : 3}
                    fill={token.colorInfo}
                  />
                  <circle
                    cx={cx}
                    cy={getY(item.newUsers)}
                    r={isHovered ? 5 : 3}
                    fill={token.colorSuccess}
                  />
                  {showLabel && (
                    <text
                      x={cx}
                      y={height - 8}
                      textAnchor="middle"
                      fontSize={11}
                      fill={token.colorTextSecondary}
                    >
                      {item.label}
                    </text>
                  )}
                  <rect
                    x={cx - Math.max(plotW / trend.length / 2, 8)}
                    y={pad.top}
                    width={Math.max(plotW / trend.length, 16)}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(idx)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: '#fcfff7',
                border: '1px solid #262626',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                fontSize: 12,
              }}
            >
              <Text strong>{hovered.label}</Text>
              <Text style={{ color: token.colorInfo }}>
                Enrollments: <strong>{formatNumber(hovered.newEnrollments)}</strong>
              </Text>
              <Text style={{ color: token.colorSuccess }}>
                New Users: <strong>{formatNumber(hovered.newUsers)}</strong>
              </Text>
              <Text>
                Est. Revenue: <strong>{formatVnd(hovered.estimatedRevenue)}</strong>
              </Text>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
