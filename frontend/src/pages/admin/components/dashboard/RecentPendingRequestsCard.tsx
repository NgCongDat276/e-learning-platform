import React from 'react';
import { Button, Card, Empty, List, Skeleton, Tag, Typography, theme } from 'antd';
import { ArrowRightOutlined, SolutionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { AdminOverviewData } from '../../../../types/admin-stats.types';

const { Text, Title } = Typography;

interface RecentPendingRequestsCardProps {
  requests?: AdminOverviewData['recentPendingRequests'];
  loading?: boolean;
}

export const RecentPendingRequestsCard: React.FC<RecentPendingRequestsCardProps> = ({
  requests = [],
  loading,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <Card
      style={{
        borderRadius: 8,
        border: '1px solid #262626',
        boxShadow: '2px 2px 0px 0px #262626',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          <SolutionOutlined style={{ marginRight: 8 }} />
          Pending Lecturer Applications
        </Title>
        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate('/admin/users')}
          style={{
            borderRadius: 4,
            color: '#262626',
            fontWeight: 600,
            boxShadow: '2px 2px 0px 0px #262626',
          }}
        >
          Review Now
        </Button>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : requests.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No pending lecturer applications"
        />
      ) : (
        <List
          size="small"
          dataSource={requests}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '10px 0',
                borderBottomColor: token.colorBorder,
              }}
            >
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text strong>{item.fullName}</Text>
                  <Tag
                    style={{
                      borderRadius: 9999,
                      margin: 0,
                      fontSize: 11,
                      border: 'none',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                    }}
                  >
                    {item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY') : 'N/A'}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {item.email}
                </Text>
                {item.note && (
                  <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    {item.note}
                  </Text>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};
