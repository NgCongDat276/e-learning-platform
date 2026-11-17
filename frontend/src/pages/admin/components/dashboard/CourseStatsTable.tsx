import React, { useState } from 'react';
import { Input, Select, Space, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAdminCourseStatsApi } from '../../../../api/admin-stats.api';
import type {
  CourseStatsItem,
  CourseStatsQuery,
  TimeRangeQuery,
} from '../../../../types/admin-stats.types';
import { formatNumber, formatVnd } from './formatters';

const { Text } = Typography;

interface CourseStatsTableProps {
  timeRange: TimeRangeQuery;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: '#ecfdf5', text: '#059669', label: 'Published' },
  draft: { bg: '#fef3c7', text: '#b45309', label: 'Draft' },
  hidden: { bg: '#f5f5f5', text: '#525252', label: 'Hidden' },
};

export const CourseStatsTable: React.FC<CourseStatsTableProps> = ({
  timeRange,
}) => {
  const { token } = theme.useToken();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CourseStatsQuery['status']>();
  const [level, setLevel] = useState<CourseStatsQuery['level']>();
  const [sortBy, setSortBy] =
    useState<CourseStatsQuery['sortBy']>('enrollmentsInPeriod');
  const [sortOrder, setSortOrder] =
    useState<CourseStatsQuery['sortOrder']>('desc');

  const queryParams: CourseStatsQuery = {
    ...timeRange,
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(level && { level }),
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-stats-courses', queryParams],
    queryFn: () => getAdminCourseStatsApi(queryParams),
    placeholderData: keepPreviousData,
  });

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<CourseStatsItem> | SorterResult<CourseStatsItem>[]
  ) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 10);

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (activeSorter?.field && activeSorter?.order) {
      setSortBy(activeSorter.field as CourseStatsQuery['sortBy']);
      setSortOrder(activeSorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy('enrollmentsInPeriod');
      setSortOrder('desc');
    }
  };

  const columns: ColumnsType<CourseStatsItem> = [
    {
      title: 'Course',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Instructor: {record.lecturerName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 115,
      render: (val: string | null) => {
        const cfg = STATUS_COLOR[val ?? 'draft'] ?? STATUS_COLOR.draft;
        return (
          <Tag
            style={{
              borderRadius: 9999,
              border: 'none',
              backgroundColor: cfg.bg,
              color: cfg.text,
              fontWeight: 600,
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      align: 'right',
      width: 120,
      render: (val: number) => (val > 0 ? formatVnd(val) : 'Free'),
    },
    {
      title: 'Enrollments (Period)',
      dataIndex: 'enrollmentsInPeriod',
      key: 'enrollmentsInPeriod',
      sorter: true,
      defaultSortOrder: 'descend',
      align: 'right',
      width: 155,
      render: (val: number) => <Text strong>{formatNumber(val)}</Text>,
    },
    {
      title: 'Total Students',
      dataIndex: 'totalEnrollments',
      key: 'totalEnrollments',
      sorter: true,
      align: 'right',
      width: 125,
      render: (val: number) => formatNumber(val),
    },
    {
      title: 'Est. Revenue',
      dataIndex: 'estimatedRevenue',
      key: 'estimatedRevenue',
      sorter: true,
      align: 'right',
      width: 155,
      render: (val: number) => formatVnd(val),
    },
    {
      title: 'Completion',
      dataIndex: 'completionRate',
      key: 'completionRate',
      sorter: true,
      align: 'right',
      width: 120,
      render: (val: number) => (
        <Text strong style={{ color: token.colorSuccess }}>
          {val}%
        </Text>
      ),
    },
    {
      title: 'Comments',
      dataIndex: 'commentsCount',
      key: 'commentsCount',
      sorter: true,
      align: 'right',
      width: 110,
      render: (val: number) => formatNumber(val),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space wrap>
          <Input.Search
            placeholder="Search course or instructor..."
            allowClear
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) {
                setSearch('');
                setPage(1);
              }
            }}
            onSearch={(val) => {
              setSearch(val.trim());
              setPage(1);
            }}
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={[
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
              { label: 'Hidden', value: 'hidden' },
            ]}
          />
          <Select
            placeholder="Level"
            allowClear
            value={level}
            onChange={(val) => {
              setLevel(val);
              setPage(1);
            }}
            style={{ width: 145 }}
            options={[
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
            ]}
          />
        </Space>
      </Space>

      <Table<CourseStatsItem>
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 900 }}
        onChange={handleTableChange}
        pagination={{
          current: data?.pagination?.page ?? page,
          pageSize: data?.pagination?.limit ?? limit,
          total: data?.pagination?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total) => `Total ${total} courses`,
        }}
      />
    </div>
  );
};
