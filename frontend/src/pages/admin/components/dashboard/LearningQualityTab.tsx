import React, { useState } from 'react';
import { Card, Col, Input, Progress, Row, Space, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { CheckCircleOutlined, FileTextOutlined, PlayCircleOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAdminLearningQualityStatsApi } from '../../../../api/admin-stats.api';
import type {
  LearningQualityQuery,
  QuizQualityItem,
  TimeRangeQuery,
} from '../../../../types/admin-stats.types';
import { formatNumber } from './formatters';

const { Text } = Typography;

interface LearningQualityTabProps {
  timeRange: TimeRangeQuery;
}

const LESSON_TYPE_META: Record<
  'video' | 'quiz' | 'text',
  { label: string; icon: React.ReactNode; color: string }
> = {
  video: { label: 'Video Lessons', icon: <PlayCircleOutlined />, color: '#2563eb' },
  quiz: { label: 'Quiz Lessons', icon: <QuestionCircleOutlined />, color: '#059669' },
  text: { label: 'Text Lessons', icon: <FileTextOutlined />, color: '#f59e0b' },
};

export const LearningQualityTab: React.FC<LearningQualityTabProps> = ({
  timeRange,
}) => {
  const { token } = theme.useToken();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] =
    useState<LearningQualityQuery['sortBy']>('attemptsInPeriod');
  const [sortOrder, setSortOrder] =
    useState<LearningQualityQuery['sortOrder']>('desc');

  const queryParams: LearningQualityQuery = {
    ...timeRange,
    page,
    limit,
    ...(search && { search }),
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-stats-learning-quality', queryParams],
    queryFn: () => getAdminLearningQualityStatsApi(queryParams),
    placeholderData: keepPreviousData,
  });

  const summary = data?.data?.summary;

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<QuizQualityItem> | SorterResult<QuizQualityItem>[]
  ) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 10);

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (activeSorter?.field && activeSorter?.order) {
      setSortBy(activeSorter.field as LearningQualityQuery['sortBy']);
      setSortOrder(activeSorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy('attemptsInPeriod');
      setSortOrder('desc');
    }
  };

  const columns: ColumnsType<QuizQualityItem> = [
    {
      title: 'Quiz / Lesson',
      dataIndex: 'quizTitle',
      key: 'quizTitle',
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.quizTitle}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Course: {record.courseTitle}
          </Text>
        </div>
      ),
    },
    {
      title: 'Passing Score',
      dataIndex: 'passingScore',
      key: 'passingScore',
      align: 'right',
      width: 120,
      render: (val: number) => `${val} pts`,
    },
    {
      title: 'Attempts (Period)',
      dataIndex: 'attemptsInPeriod',
      key: 'attemptsInPeriod',
      sorter: true,
      defaultSortOrder: 'descend',
      align: 'right',
      width: 145,
      render: (val: number) => <Text strong>{formatNumber(val)}</Text>,
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      sorter: true,
      align: 'right',
      width: 125,
      render: (val: number) => (
        <Tag
          style={{
            borderRadius: 9999,
            border: 'none',
            backgroundColor: val >= 60 ? '#ecfdf5' : '#fef2f2',
            color: val >= 60 ? token.colorSuccess : token.colorError,
            fontWeight: 600,
          }}
        >
          {val}%
        </Tag>
      ),
    },
    {
      title: 'Avg. Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      sorter: true,
      align: 'right',
      width: 110,
      render: (val: number) => <Text strong>{val}</Text>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              border: `1px solid ${token.colorBorder}`,
              backgroundColor: '#fcfff7',
              height: '100%',
            }}
          >
            <Row gutter={12}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Quiz Submissions
                </Text>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {formatNumber(summary?.quizAttemptsInPeriod ?? 0)}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Pass Rate
                </Text>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginTop: 4,
                    color: token.colorSuccess,
                  }}
                >
                  <CheckCircleOutlined style={{ marginRight: 4, fontSize: 16 }} />
                  {summary?.quizPassRate ?? 0}%
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Avg. Score
                </Text>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {summary?.averageQuizScore ?? 0}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              border: `1px solid ${token.colorBorder}`,
              backgroundColor: '#fcfff7',
              height: '100%',
            }}
          >
            <Row gutter={[16, 8]}>
              {(summary?.lessonProgressByType ?? []).map((item) => {
                const meta = LESSON_TYPE_META[item.lessonType];
                return (
                  <Col key={item.lessonType} xs={24} sm={8}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 2,
                      }}
                    >
                      <Space size={4}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <Text>{meta.label}</Text>
                      </Space>
                      <Text strong>{item.completionRate}%</Text>
                    </div>
                    <Progress
                      percent={item.completionRate}
                      showInfo={false}
                      strokeColor={meta.color}
                      size="small"
                    />
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Search + Quiz Table */}
      <Space wrap>
        <Input.Search
          placeholder="Search by quiz, lesson, or course..."
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
          style={{ width: 300 }}
        />
      </Space>

      <Table<QuizQualityItem>
        rowKey="quizId"
        columns={columns}
        dataSource={data?.data?.quizzes ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 760 }}
        onChange={handleTableChange}
        pagination={{
          current: data?.pagination?.page ?? page,
          pageSize: data?.pagination?.limit ?? limit,
          total: data?.pagination?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total) => `Total ${total} quizzes`,
        }}
      />
    </div>
  );
};
