import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  Card,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Modal,
  Drawer,
  theme,
  App,
  Descriptions,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import {
  getLecturerRequestsApi,
  getLecturerRequestsStatsApi,
  reviewLecturerRequestApi,
} from '../../../api/lecturer-request.api';
import type {
  LecturerRequest,
  LecturerRequestStatus,
  LecturerRequestsStats,
  LecturerRequestsQuery,
} from '../../../types/lecturer-request.types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface LecturerRequestsTabProps {
  onStatsChange?: () => void;
}

export const LecturerRequestsTab: React.FC<LecturerRequestsTabProps> = ({ onStatsChange }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  // State danh sách đơn & phân trang
  const [requests, setRequests] = useState<LecturerRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
  }>({
    page: 1,
    limit: 10,
    total: 0,
  });

  // State thống kê số lượng đơn
  const [stats, setStats] = useState<LecturerRequestsStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  // State bộ lọc tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LecturerRequestStatus | 'all'>('pending');

  // State xử lý hành động duyệt/từ chối
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // State Modal từ chối (Nhập lý do)
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectTargetRequest, setRejectTargetRequest] = useState<LecturerRequest | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  // State Drawer xem chi tiết hồ sơ
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<LecturerRequest | null>(null);

  // Fetch thống kê
  const fetchStats = useCallback(async () => {
    try {
      const res = await getLecturerRequestsStatsApi();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // Bỏ qua lỗi thống kê nhẹ
    }
  }, []);

  // Fetch danh sách đơn
  const fetchRequests = useCallback(
    async (
      page = pagination.page,
      limit = pagination.limit,
      search = searchKeyword,
      status = statusFilter
    ) => {
      setLoading(true);
      try {
        const queryParams: LecturerRequestsQuery = {
          page,
          limit,
        };

        if (search.trim()) {
          queryParams.search = search.trim();
        }

        if (status) {
          queryParams.status = status;
        }

        const res = await getLecturerRequestsApi(queryParams);
        if (res.success && res.data) {
          setRequests(res.data.items);
          if (res.data.pagination) {
            setPagination({
              page: res.data.pagination.page,
              limit: res.data.pagination.limit,
              total: res.data.pagination.total,
            });
          }
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Failed to fetch lecturer applications');
        }
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchKeyword, statusFilter, message]
  );

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchRequests(1, pagination.limit, searchKeyword, statusFilter);
        fetchStats();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = () => {
    fetchRequests(1, pagination.limit, searchKeyword, statusFilter);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setStatusFilter('pending');
    fetchRequests(1, pagination.limit, '', 'pending');
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1;
    const newLimit = newPagination.pageSize || 10;
    fetchRequests(newPage, newLimit, searchKeyword, statusFilter);
  };

  // 1. Phê duyệt đơn
  const handleApprove = async (record: LecturerRequest) => {
    setReviewingId(record.id);
    try {
      const res = await reviewLecturerRequestApi(record.id, {
        status: 'approved',
        note: 'Approved by Administrator',
      });
      if (res.success) {
        message.success(`Approved! ${record.candidate.full_name} is now a Lecturer.`);
        fetchRequests(pagination.page, pagination.limit, searchKeyword, statusFilter);
        fetchStats();
        if (onStatsChange) onStatsChange();
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to approve application');
      }
    } finally {
      setReviewingId(null);
    }
  };

  // 2. Mở Modal từ chối
  const handleOpenRejectModal = (record: LecturerRequest) => {
    setRejectTargetRequest(record);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  // 3. Xác nhận từ chối đơn
  const handleConfirmReject = async () => {
    if (!rejectTargetRequest) return;
    setSubmittingReject(true);
    try {
      const res = await reviewLecturerRequestApi(rejectTargetRequest.id, {
        status: 'rejected',
        note: rejectNote.trim() || 'Application was not approved at this time.',
      });
      if (res.success) {
        message.info(`Application for ${rejectTargetRequest.candidate.full_name} was rejected.`);
        setRejectModalOpen(false);
        fetchRequests(pagination.page, pagination.limit, searchKeyword, statusFilter);
        fetchStats();
        if (onStatsChange) onStatsChange();
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to reject application');
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  // 4. Mở Drawer xem chi tiết hồ sơ
  const handleOpenDetail = (record: LecturerRequest) => {
    setSelectedRequest(record);
    setDetailDrawerOpen(true);
  };

  const renderStatusTag = (status: LecturerRequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fcd34d',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Pending Review
          </Tag>
        );
      case 'approved':
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            style={{
              backgroundColor: '#dcfff1',
              color: '#059669',
              border: '1px solid #7ee2b8',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Approved
          </Tag>
        );
      case 'rejected':
        return (
          <Tag
            icon={<CloseCircleOutlined />}
            style={{
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: '1px solid #fca5a5',
              borderRadius: 9999,
              fontWeight: 600,
              padding: '2px 8px',
            }}
          >
            Rejected
          </Tag>
        );
    }
  };

  const columns: ColumnsType<LecturerRequest> = [
    {
      title: 'Applicant',
      key: 'applicant',
      minWidth: 250,
      render: (_, record) => (
        <Space size="middle" align="center">
          <Avatar
            size={42}
            src={record.candidate.avatar_url}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              fontWeight: 700,
              border: `1px solid ${token.colorBorder}`,
              boxShadow: '1px 1px 0 0 #262626',
            }}
          >
            {record.candidate.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 15, color: token.colorText, display: 'block' }}>
              {record.candidate.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {record.candidate.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Academic & Expertise',
      key: 'credentials',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.candidate.degree ? (
            <Tag
              style={{
                borderRadius: 4,
                backgroundColor: token.colorBgLayout,
                borderColor: token.colorBorder,
                color: token.colorText,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {record.candidate.degree}
            </Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No degree provided
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: record.candidate.expertise || '' }}>
            {record.candidate.expertise || 'No expertise specified'}
          </Text>
          {record.candidate.cv_url && (
            <Button
              type="link"
              size="small"
              icon={<FilePdfOutlined />}
              href={record.candidate.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: 0, height: 'auto', fontSize: 12, color: token.colorInfo }}
            >
              View CV Document <LinkOutlined style={{ fontSize: 10 }} />
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return (
          <Text style={{ fontSize: 13 }}>
            {d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: LecturerRequestStatus) => renderStatusTag(status),
    },
    {
      title: 'Review Audit',
      key: 'review_audit',
      width: 180,
      render: (_, record) => {
        if (record.status === 'pending') {
          return (
            <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
              Awaiting decision
            </Text>
          );
        }
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>
              by <Text strong>{record.reviewer?.full_name || 'Admin'}</Text>
            </Text>
            {record.reviewed_at && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {new Date(record.reviewed_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            )}
            {record.note && (
              <Tooltip title={record.note}>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, maxWidth: 160 }}
                  ellipsis
                >
                  "{record.note}"
                </Text>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const isActionLoading = reviewingId === record.id;
        const isPending = record.status === 'pending';

        return (
          <Space size="small">
            {/* View Full Profile */}
            <Tooltip title="View Candidate Profile & Background">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetail(record)}
                style={{ borderRadius: 4 }}
              />
            </Tooltip>

            {isPending && (
              <>
                {/* Approve */}
                <Popconfirm
                  title="Approve this application?"
                  description="The user will be promoted to Lecturer and granted full teaching access."
                  okText="Approve"
                  cancelText="Cancel"
                  okButtonProps={{
                    style: {
                      backgroundColor: token.colorPrimary,
                      color: token.colorText,
                      border: `1px solid ${token.colorText}`,
                      boxShadow: '1px 1px 0 0 #262626',
                      fontWeight: 600,
                    },
                  }}
                  onConfirm={() => handleApprove(record)}
                >
                  <Tooltip title="Approve & Grant Lecturer Role">
                    <Button
                      size="small"
                      loading={isActionLoading}
                      icon={<CheckOutlined />}
                      style={{
                        borderRadius: 4,
                        borderColor: '#059669',
                        color: '#059669',
                        fontWeight: 600,
                      }}
                    />
                  </Tooltip>
                </Popconfirm>

                {/* Reject */}
                <Tooltip title="Reject Application">
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleOpenRejectModal(record)}
                    style={{ borderRadius: 4 }}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Pending Reviews
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#f59e0b' }}>
                {stats.pending}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Approved
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#059669' }}>
                {stats.approved}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Rejected
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: '#ef4444' }}>
                {stats.rejected}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: token.colorBorder,
              boxShadow: '2px 2px 0 0 #262626',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                Total Submissions
              </Text>
              <Title level={3} style={{ margin: 0, fontSize: 28, color: token.colorText }}>
                {stats.total}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filter and Table Container */}
      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: token.colorBorder,
          boxShadow: '2px 2px 0 0 #262626',
          backgroundColor: token.colorBgContainer,
        }}
        styles={{ body: { padding: 24 } }}
      >
        {/* Filter Controls Toolbar */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col xs={24} md={16}>
            <Space wrap size="middle">
              <Input
                placeholder="Search applicant name or email..."
                prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 280, borderRadius: 4 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 170, borderRadius: 4 }}
              >
                <Option value="pending">Pending Only</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="all">All Applications</Option>
              </Select>
              <Button
                type="primary"
                onClick={handleSearch}
                style={{
                  borderRadius: 4,
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: '1px 1px 0 0 #262626',
                  fontWeight: 600,
                }}
              >
                Filter
              </Button>
              {(searchKeyword || statusFilter !== 'pending') && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  style={{ borderRadius: 4 }}
                >
                  Reset
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Displaying <Text strong>{requests.length}</Text> of <Text strong>{pagination.total}</Text>{' '}
              applications
            </Text>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 6,
          }}
        />
      </Card>

      {/* Reject Modal with Note */}
      <Modal
        open={rejectModalOpen}
        title={
          <Space align="center">
            <StopOutlined style={{ color: token.colorError }} />
            <Text strong>Reject Lecturer Application</Text>
          </Space>
        }
        onCancel={() => setRejectModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalOpen(false)} style={{ borderRadius: 4 }}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            danger
            type="primary"
            loading={submittingReject}
            onClick={handleConfirmReject}
            style={{ borderRadius: 4, fontWeight: 600 }}
          >
            Confirm Rejection
          </Button>,
        ]}
        destroyOnClose
      >
        <Paragraph type="secondary" style={{ fontSize: 14, marginTop: 8 }}>
          Are you sure you want to decline the lecturer application for{' '}
          <Text strong style={{ color: token.colorText }}>
            {rejectTargetRequest?.candidate.full_name}
          </Text>
          ? The candidate will remain a Student.
        </Paragraph>
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            Rejection Feedback Note (Optional):
          </Text>
          <TextArea
            rows={3}
            placeholder="e.g. CV document is inaccessible, or qualifications do not meet current subject standards."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            style={{ borderRadius: 4 }}
            maxLength={1000}
            showCount
          />
        </div>
      </Modal>

      {/* Candidate Profile Details Drawer */}
      <Drawer
        open={detailDrawerOpen}
        title={
          <Space align="center">
            <UserOutlined style={{ color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 16 }}>
              Lecturer Application Details
            </Text>
          </Space>
        }
        onClose={() => setDetailDrawerOpen(false)}
        width={520}
      >
        {selectedRequest && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Applicant Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                backgroundColor: token.colorBgLayout,
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <Avatar
                size={56}
                src={selectedRequest.candidate.avatar_url}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: 22,
                  fontWeight: 700,
                  boxShadow: '1px 1px 0 0 #262626',
                }}
              >
                {selectedRequest.candidate.full_name?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0, color: token.colorText }}>
                  {selectedRequest.candidate.full_name}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedRequest.candidate.email}
                </Text>
                <div style={{ marginTop: 6 }}>
                  {renderStatusTag(selectedRequest.status)}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <Descriptions
              title={<Text strong style={{ fontSize: 14 }}>Academic & Credentials</Text>}
              bordered
              column={1}
              size="small"
              styles={{ label: { width: 140, fontWeight: 600 } }}
            >
              <Descriptions.Item label="Highest Degree">
                {selectedRequest.candidate.degree || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Primary Expertise">
                {selectedRequest.candidate.expertise || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Certifications">
                {selectedRequest.candidate.certificates || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="CV Document">
                {selectedRequest.candidate.cv_url ? (
                  <Button
                    type="link"
                    icon={<FilePdfOutlined />}
                    href={selectedRequest.candidate.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: 0 }}
                  >
                    Open Document Link <LinkOutlined />
                  </Button>
                ) : (
                  <Text type="secondary">No link provided</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Biography */}
            <div>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                Professional Biography
              </Text>
              <Paragraph
                style={{
                  backgroundColor: token.colorBgLayout,
                  padding: 12,
                  borderRadius: 6,
                  border: `1px solid ${token.colorBorder}`,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {selectedRequest.candidate.bio || 'The applicant has not provided a biography yet.'}
              </Paragraph>
            </div>

            {/* Application Audit */}
            <Descriptions
              title={<Text strong style={{ fontSize: 14 }}>Application Timeline</Text>}
              bordered
              column={1}
              size="small"
              styles={{ label: { width: 140, fontWeight: 600 } }}
            >
              <Descriptions.Item label="Submitted On">
                {new Date(selectedRequest.created_at).toLocaleString('en-GB')}
              </Descriptions.Item>
              {selectedRequest.reviewed_at && (
                <Descriptions.Item label="Reviewed On">
                  {new Date(selectedRequest.reviewed_at).toLocaleString('en-GB')}
                </Descriptions.Item>
              )}
              {selectedRequest.reviewer && (
                <Descriptions.Item label="Reviewed By">
                  {selectedRequest.reviewer.full_name} ({selectedRequest.reviewer.email})
                </Descriptions.Item>
              )}
              {selectedRequest.note && (
                <Descriptions.Item label="Review Note">
                  {selectedRequest.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Quick Actions at bottom of Drawer if still pending */}
            {selectedRequest.status === 'pending' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Popconfirm
                  title="Approve this application?"
                  description="Candidate will be given Lecturer privileges immediately."
                  okText="Approve"
                  cancelText="Cancel"
                  onConfirm={() => {
                    handleApprove(selectedRequest);
                    setDetailDrawerOpen(false);
                  }}
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    style={{
                      flex: 1,
                      backgroundColor: token.colorPrimary,
                      color: token.colorText,
                      border: `1px solid ${token.colorText}`,
                      boxShadow: '1px 1px 0 0 #262626',
                      fontWeight: 600,
                    }}
                  >
                    Approve Application
                  </Button>
                </Popconfirm>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    handleOpenRejectModal(selectedRequest);
                  }}
                  style={{ flex: 1, borderRadius: 4, fontWeight: 600 }}
                >
                  Reject Application
                </Button>
              </div>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
};
