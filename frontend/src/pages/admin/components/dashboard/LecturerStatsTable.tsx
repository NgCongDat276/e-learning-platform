import React, { useState } from 'react';
import { Input, Space, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAdminLecturerStatsApi } from '../../../../api/admin-stats.api';
import type {
  LecturerStatsItem,
  LecturerStatsQuery,
  TimeRangeQuery,
} from '../../../../types/admin-stats.types';
import { formatNumber, formatVnd } from './formatters';

const { Text } = Typography;

interface LecturerStatsTableProps {
  timeRange: TimeRangeQuery;
}

export const LecturerStatsTable: React.FC<LecturerStatsTableProps> = ({
  timeRange,
}) => {
  const { token } = theme.useToken();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] =
    useState<LecturerStatsQuery['sortBy']>('enrollmentsInPeriod');
  const [sortOrder, setSortOrder] =
    useState<LecturerStatsQuery['sortOrder']>('desc');

  const queryParams: LecturerStatsQuery = {
    ...timeRange,
    page,
    limit,
    ...(search && { search }),
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-stats-lecturers', queryParams],
    queryFn: () => getAdminLecturerStatsApi(queryParams),
    placeholderData: keepPreviousData,
  });

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<LecturerStatsItem> | SorterResult<LecturerStatsItem>[]
  ) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 10);

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (activeSorter?.field && activeSorter?.order) {
      setSortBy(activeSorter.field as LecturerStatsQuery['sortBy']);
      setSortOrder(activeSorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy('enrollmentsInPeriod');
      setSortOrder('desc');
    }
  };

  const columns: ColumnsType<LecturerStatsItem> = [
    {
      title: 'Lecturer',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.fullName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Expertise',
      dataIndex: 'expertise',
      key: 'expertise',
      render: (val: string | null) =>
        val ? (
          <Tag style={{ borderRadius: 9999 }}>{val}</Tag>
        ) : (
          <Text type="secondary">Not updated</Text>
        ),
    },
    {
      title: 'Published Courses',
      dataIndex: 'publishedCourses',
      key: 'publishedCourses',
      sorter: true,
      align: 'right',
      width: 150,
      render: (val: number, record) => (
        <span>
          <Text strong>{val}</Text> / {record.totalCourses}
        </span>
      ),
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
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      sorter: true,
      align: 'right',
      width: 135,
      render: (val: number) => formatNumber(val),
    },
    {
      title: 'Est. Revenue',
      dataIndex: 'estimatedRevenue',
      key: 'estimatedRevenue',
      sorter: true,
      align: 'right',
      width: 165,
      render: (val: number) => formatVnd(val),
    },
    {
      title: 'Avg. Completion',
      dataIndex: 'completionRate',
      key: 'completionRate',
      sorter: true,
      align: 'right',
      width: 145,
      render: (val: number) => (
        <Text strong style={{ color: token.colorSuccess }}>
          {val}%
        </Text>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Space wrap>
        <Input.Search
          placeholder="Search by name, email, or expertise..."
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
          style={{ width: 290 }}
        />
      </Space>

      <Table<LecturerStatsItem>
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 860 }}
        onChange={handleTableChange}
        pagination={{
          current: data?.pagination?.page ?? page,
          pageSize: data?.pagination?.limit ?? limit,
          total: data?.pagination?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total) => `Total ${total} lecturers`,
        }}
      />
    </div>
  );
};
