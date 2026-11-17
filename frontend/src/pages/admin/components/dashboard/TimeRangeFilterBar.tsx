import React from 'react';
import { Button, DatePicker, Space, Typography, theme } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export type PresetKey = '1d' | '7d' | '30d' | 'custom';

interface TimeRangeFilterBarProps {
  activePreset: PresetKey;
  range: [Dayjs, Dayjs];
  loading?: boolean;
  onSelectPreset: (preset: Exclude<PresetKey, 'custom'>) => void;
  onChangeRange: (range: [Dayjs, Dayjs]) => void;
  onRefresh: () => void;
}

const PRESETS: Array<{ key: Exclude<PresetKey, 'custom'>; label: string }> = [
  { key: '1d', label: '1 Day' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

export const TimeRangeFilterBar: React.FC<TimeRangeFilterBarProps> = ({
  activePreset,
  range,
  loading,
  onSelectPreset,
  onChangeRange,
  onRefresh,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Space size={6} wrap>
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.key;
          return (
            <Button
              key={preset.key}
              type={isActive ? 'primary' : 'default'}
              size="middle"
              onClick={() => onSelectPreset(preset.key)}
              style={{
                borderRadius: 4,
                fontWeight: isActive ? 600 : 500,
                borderColor: isActive ? '#262626' : token.colorBorder,
                color: '#262626',
                boxShadow: isActive ? '2px 2px 0px 0px #262626' : 'none',
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </Space>

      <RangePicker
        value={range}
        allowClear={false}
        format="DD/MM/YYYY"
        suffixIcon={<CalendarOutlined />}
        disabledDate={(current) => current && current > dayjs().endOf('day')}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) {
            onChangeRange([dates[0].startOf('day'), dates[1].endOf('day')]);
          }
        }}
        style={{
          borderRadius: 4,
          borderColor: token.colorBorder,
        }}
      />

      <Button
        icon={<ReloadOutlined spin={loading} />}
        onClick={onRefresh}
        style={{
          borderRadius: 4,
          borderColor: token.colorBorder,
          color: token.colorText,
        }}
      >
        <Text style={{ fontSize: 13 }}>Refresh</Text>
      </Button>
    </div>
  );
};
