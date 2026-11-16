import React, { useMemo } from 'react';
import { Card, Typography, Tooltip, Skeleton, Space, theme } from 'antd';
import { CalendarOutlined, InfoCircleOutlined, FireOutlined } from '@ant-design/icons';
import type { StudentHeatmapData, HeatmapDayItem } from '../../../types/enrollment.types';

const { Text, Title } = Typography;

interface StudentActivityHeatmapProps {
  heatmap?: StudentHeatmapData;
  loading?: boolean;
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#ebedf0', // No activity
  1: '#9be9a8', // Low
  2: '#40c463', // Medium
  3: '#30a14e', // High
  4: '#216e39', // Very high
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const StudentActivityHeatmap: React.FC<StudentActivityHeatmapProps> = ({
  heatmap,
  loading = false,
}) => {
  const { token } = theme.useToken();

  // Nhóm các ngày thành các tuần (mỗi tuần 7 ngày: Sun -> Sat)
  const { weeks, monthLabels } = useMemo(() => {
    if (!heatmap?.days || heatmap.days.length === 0) {
      return { weeks: [], monthLabels: [] };
    }

    const weeksList: HeatmapDayItem[][] = [];
    let currentWeek: HeatmapDayItem[] = [];

    heatmap.days.forEach((dayItem) => {
      currentWeek.push(dayItem);
      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    // Xác định vị trí hiển thị nhãn tháng trên đầu các tuần
    const labels: Array<{ weekIndex: number; monthName: string }> = [];
    let lastMonth = -1;

    weeksList.forEach((week, wIndex) => {
      // Lấy ngày đầu tuần
      const firstDayInWeek = week[0];
      if (firstDayInWeek) {
        const d = new Date(firstDayInWeek.date);
        const m = d.getMonth();
        // Chỉ đặt nhãn nếu tháng thay đổi và cách nhãn trước ít nhất 2 tuần
        if (m !== lastMonth && (labels.length === 0 || wIndex - labels[labels.length - 1].weekIndex >= 3)) {
          labels.push({
            weekIndex: wIndex,
            monthName: MONTH_NAMES[m],
          });
          lastMonth = m;
        }
      }
    });

    return { weeks: weeksList, monthLabels: labels };
  }, [heatmap]);

  const formatDateTooltip = (item: HeatmapDayItem) => {
    const d = new Date(item.date);
    const dateFormatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (item.count === 0) {
      return `${dateFormatted}: No study activity recorded`;
    }

    const parts: string[] = [];
    if (item.lessonCount > 0) {
      parts.push(`${item.lessonCount} ${item.lessonCount === 1 ? 'lesson' : 'lessons'}`);
    }
    if (item.quizCount > 0) {
      parts.push(`${item.quizCount} ${item.quizCount === 1 ? 'quiz' : 'quizzes'}`);
    }

    return `${dateFormatted}: ${item.count} ${
      item.count === 1 ? 'activity' : 'activities'
    } (${parts.join(', ')})`;
  };

  if (loading || !heatmap) {
    return (
      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: token.colorBorder,
          boxShadow: '1px 1px 0px 0px #262626',
          marginBottom: 20,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  return (
    <Card
      bordered
      style={{
        borderRadius: 8,
        borderColor: token.colorBorder,
        boxShadow: '1px 1px 0px 0px #262626',
        backgroundColor: token.colorBgContainer,
        marginBottom: 20,
        width: '100%',
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* 1. Header Card Heatmap */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarOutlined style={{ fontSize: 18, color: '#15803d' }} />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Learning Activity Heatmap
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Track your daily study consistency over the past 4 months
            </Text>
          </div>
        </div>

        <Space size={14}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '4px 12px',
              borderRadius: 9999,
            }}
          >
            <FireOutlined style={{ color: '#16a34a' }} />
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
              {heatmap.totalActiveDays} {heatmap.totalActiveDays === 1 ? 'active day' : 'active days'}
            </Text>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '4px 12px',
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {heatmap.totalActivities} {heatmap.totalActivities === 1 ? 'activity' : 'activities'}
            </Text>
          </div>
        </Space>
      </div>

      {/* 2. Lưới Heatmap kiểu GitHub 100% width */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        <div style={{ minWidth: 780, width: '100%' }}>
          {/* Hàng nhãn Tháng */}
          <div
            style={{
              display: 'flex',
              marginLeft: 34, // Bù trừ chiều rộng cột nhãn thứ Mon/Wed/Fri
              marginBottom: 6,
              position: 'relative',
              height: 18,
            }}
          >
            {monthLabels.map((lbl, idx) => {
              // Tính % vị trí theo số tuần
              const leftPercent = (lbl.weekIndex / weeks.length) * 100;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: token.colorTextSecondary,
                  }}
                >
                  {lbl.monthName}
                </div>
              );
            })}
          </div>

          {/* Lưới các ô theo tuần và thứ */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Cột nhãn các Thứ (Mon, Wed, Fri) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: 24,
                height: 105,
                fontSize: 10,
                fontWeight: 600,
                color: token.colorTextQuaternary || '#9ca3af',
                userSelect: 'none',
                textAlign: 'right',
                paddingRight: 4,
              }}
            >
              <span style={{ height: 13, lineHeight: '13px' }}></span>
              <span style={{ height: 13, lineHeight: '13px' }}>Mon</span>
              <span style={{ height: 13, lineHeight: '13px' }}></span>
              <span style={{ height: 13, lineHeight: '13px' }}>Wed</span>
              <span style={{ height: 13, lineHeight: '13px' }}></span>
              <span style={{ height: 13, lineHeight: '13px' }}>Fri</span>
              <span style={{ height: 13, lineHeight: '13px' }}></span>
            </div>

            {/* Các cột tuần trải đều 100% chiều rộng */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                gap: 4,
                justifyContent: 'space-between',
              }}
            >
              {weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {week.map((dayItem, dIdx) => {
                    const bgColor = LEVEL_COLORS[dayItem.level] || LEVEL_COLORS[0];
                    return (
                      <Tooltip
                        key={dIdx}
                        title={formatDateTooltip(dayItem)}
                        placement="top"
                        arrow
                      >
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            maxHeight: 14,
                            borderRadius: 2,
                            backgroundColor: bgColor,
                            border:
                              dayItem.level === 0
                                ? '1px solid rgba(0, 0, 0, 0.05)'
                                : '1px solid rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.25)';
                            e.currentTarget.style.zIndex = '2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer Heatmap: Chú thích Less -> More */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 10,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          fontSize: 11,
          color: token.colorTextSecondary,
        }}
      >
        <Space size={6}>
          <InfoCircleOutlined style={{ fontSize: 12 }} />
          <span>
            Activities count toward completed video lectures, reading lessons, and quiz submissions
          </span>
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              style={{
                width: 11,
                height: 11,
                borderRadius: 2,
                backgroundColor: LEVEL_COLORS[lvl],
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </Card>
  );
};

