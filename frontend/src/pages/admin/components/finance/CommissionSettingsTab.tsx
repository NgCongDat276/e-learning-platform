import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Slider,
  InputNumber,
  Button,
  Table,
  Tag,
  Space,
  Divider,
  Alert,
  Skeleton,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PercentageOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import {
  getAdminCommissionSettingsApi,
  updateAdminPlatformSettingsApi,
  updateCourseCommissionApi,
  updateLecturerCommissionApi,
} from '../../../../api/revenue.api';
import type { AdminCommissionSettingsResponse } from '../../../../types/revenue.types';

const { Title, Text } = Typography;

export const CommissionSettingsTab: React.FC = () => {
  const { message } = App.useApp();

  const [data, setData] = useState<AdminCommissionSettingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingGlobal, setSavingGlobal] = useState<boolean>(false);

  const [defaultRate, setDefaultRate] = useState<number>(30);
  const [minPayout, setMinPayout] = useState<number>(100000);
  const [expiryMinutes, setExpiryMinutes] = useState<number>(15);

  const [lecturerDrafts, setLecturerDrafts] = useState<Record<string, number | null>>({});
  const [courseDrafts, setCourseDrafts] = useState<Record<string, number | null>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await getAdminCommissionSettingsApi();
        if (!ignore && res.success && res.data) {
          setData(res.data);
          setDefaultRate(res.data.settings.defaultPlatformFeeRate);
          setMinPayout(res.data.settings.minPayoutAmount);
          setExpiryMinutes(res.data.settings.orderExpiryMinutes);

          const lMap: Record<string, number | null> = {};
          res.data.lecturers.forEach((l) => {
            lMap[l.id] = l.platformFeeRate;
          });
          setLecturerDrafts(lMap);

          const cMap: Record<string, number | null> = {};
          res.data.courses.forEach((c) => {
            cMap[c.id] = c.platformFeeRate;
          });
          setCourseDrafts(cMap);
        }
      } catch {
        if (!ignore) message.error('Failed to load commission settings');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [message]);

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      const res = await updateAdminPlatformSettingsApi({
        defaultPlatformFeeRate: defaultRate,
        minPayoutAmount: minPayout,
        orderExpiryMinutes: expiryMinutes,
      });
      if (res.success && res.data) {
        message.success('Platform financial settings updated');
        setData((prev) => (prev ? { ...prev, settings: res.data! } : prev));
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to update platform settings');
      }
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSaveLecturerRate = async (
    lecturerId: string,
    rate: number | null
  ) => {
    setSavingRowId(lecturerId);
    try {
      const res = await updateLecturerCommissionApi(lecturerId, rate);
      if (res.success) {
        message.success(
          rate === null
            ? 'Reset lecturer to global default rate'
            : `Set platform fee to ${rate}% for lecturer`
        );
        setLecturerDrafts((prev) => ({ ...prev, [lecturerId]: rate }));
        setData((prev) =>
          prev
            ? {
                ...prev,
                lecturers: prev.lecturers.map((l) =>
                  l.id === lecturerId ? { ...l, platformFeeRate: rate } : l
                ),
              }
            : prev
        );
      }
    } catch {
      message.error('Failed to update lecturer commission rate');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleSaveCourseRate = async (
    courseId: string,
    rate: number | null
  ) => {
    setSavingRowId(courseId);
    try {
      const res = await updateCourseCommissionApi(courseId, rate);
      if (res.success) {
        message.success(
          rate === null
            ? 'Reset course to inherit Lecturer / Global rate'
            : `Set platform fee to ${rate}% for course`
        );
        setCourseDrafts((prev) => ({ ...prev, [courseId]: rate }));
        setData((prev) =>
          prev
            ? {
                ...prev,
                courses: prev.courses.map((c) =>
                  c.id === courseId ? { ...c, platformFeeRate: rate } : c
                ),
              }
            : prev
        );
      }
    } catch {
      message.error('Failed to update course commission rate');
    } finally {
      setSavingRowId(null);
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const simPrice = 1_000_000;
  const simAdmin = Math.round((simPrice * defaultRate) / 100);
  const simLecturer = simPrice - simAdmin;

  const lecturerColumns: ColumnsType<AdminCommissionSettingsResponse['lecturers'][0]> = [
    {
      title: 'Lecturer',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.fullName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Applied Rule',
      render: (_, r) =>
        r.platformFeeRate !== null ? (
          <Tag color="blue" style={{ borderRadius: 9999 }}>
            Custom: Admin {r.platformFeeRate}% / Lecturer {100 - r.platformFeeRate}%
          </Tag>
        ) : (
          <Tag style={{ borderRadius: 9999 }}>
            Inherits Global ({data?.settings.defaultPlatformFeeRate}%)
          </Tag>
        ),
    },
    {
      title: 'Custom Admin Fee %',
      render: (_, r) => (
        <InputNumber
          min={0}
          max={100}
          value={lecturerDrafts[r.id] ?? undefined}
          placeholder={`Default (${data?.settings.defaultPlatformFeeRate}%)`}
          onChange={(val) =>
            setLecturerDrafts((prev) => ({
              ...prev,
              [r.id]: val === null ? null : Number(val),
            }))
          }
          addonAfter="%"
          style={{ width: 170 }}
        />
      ),
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            loading={savingRowId === r.id}
            onClick={() =>
              void handleSaveLecturerRate(r.id, lecturerDrafts[r.id] ?? null)
            }
            style={{
              backgroundColor: '#a3e635',
              borderColor: '#262626',
              color: '#262626',
              fontWeight: 600,
              borderRadius: 4,
            }}
          >
            Save
          </Button>
          {r.platformFeeRate !== null && (
            <Button
              size="small"
              icon={<UndoOutlined />}
              loading={savingRowId === r.id}
              onClick={() => void handleSaveLecturerRate(r.id, null)}
              style={{ borderRadius: 4 }}
            >
              Reset
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const courseColumns: ColumnsType<AdminCommissionSettingsResponse['courses'][0]> = [
    {
      title: 'Paid Course',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lecturer: {r.lecturer.fullName} · Price: {r.price.toLocaleString('vi-VN')} ₫
          </Text>
        </Space>
      ),
    },
    {
      title: 'Applied Rule',
      render: (_, r) =>
        r.platformFeeRate !== null ? (
          <Tag color="purple" style={{ borderRadius: 9999 }}>
            Course Override: Admin {r.platformFeeRate}% / Lecturer {100 - r.platformFeeRate}%
          </Tag>
        ) : (
          <Tag style={{ borderRadius: 9999 }}>Inherits Lecturer / Global</Tag>
        ),
    },
    {
      title: 'Custom Admin Fee %',
      render: (_, r) => (
        <InputNumber
          min={0}
          max={100}
          value={courseDrafts[r.id] ?? undefined}
          placeholder="Inherit"
          onChange={(val) =>
            setCourseDrafts((prev) => ({
              ...prev,
              [r.id]: val === null ? null : Number(val),
            }))
          }
          addonAfter="%"
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            loading={savingRowId === r.id}
            onClick={() =>
              void handleSaveCourseRate(r.id, courseDrafts[r.id] ?? null)
            }
            style={{
              backgroundColor: '#a3e635',
              borderColor: '#262626',
              color: '#262626',
              fontWeight: 600,
              borderRadius: 4,
            }}
          >
            Save
          </Button>
          {r.platformFeeRate !== null && (
            <Button
              size="small"
              icon={<UndoOutlined />}
              loading={savingRowId === r.id}
              onClick={() => void handleSaveCourseRate(r.id, null)}
              style={{ borderRadius: 4 }}
            >
              Reset
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Commission Priority Hierarchy: Course Override > Lecturer Override > Global Default. Changes apply to newly created orders only (existing paid orders preserve their snapshot)."
        style={{ borderRadius: 6 }}
      />

      <Card
        title={
          <Space>
            <PercentageOutlined />
            <span>Global Commission & System Limits</span>
          </Space>
        }
        style={{ borderRadius: 8, border: '1.5px solid #262626' }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={14}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>
                  Default Platform Fee (Admin): {defaultRate}% · Lecturer Share:{' '}
                  {100 - defaultRate}%
                </Text>
                <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                  <Col flex="auto">
                    <Slider
                      min={0}
                      max={100}
                      value={defaultRate}
                      onChange={(val) => setDefaultRate(val)}
                    />
                  </Col>
                  <Col>
                    <InputNumber
                      min={0}
                      max={100}
                      value={defaultRate}
                      onChange={(val) => setDefaultRate(Number(val ?? 0))}
                      addonAfter="%"
                    />
                  </Col>
                </Row>
              </div>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Text strong style={{ display: 'block', marginBottom: 6 }}>
                    Minimum Payout Amount (VND)
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={50000}
                    value={minPayout}
                    onChange={(val) => setMinPayout(Number(val ?? 0))}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => Number((value || '').replace(/,/g, ''))}
                    addonAfter="₫"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong style={{ display: 'block', marginBottom: 6 }}>
                    VietQR Order Expiry (Minutes)
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={1440}
                    value={expiryMinutes}
                    onChange={(val) => setExpiryMinutes(Number(val ?? 15))}
                    addonAfter="min"
                  />
                </Col>
              </Row>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={savingGlobal}
                onClick={() => void handleSaveGlobal()}
                style={{
                  backgroundColor: '#a3e635',
                  borderColor: '#262626',
                  color: '#262626',
                  fontWeight: 700,
                  borderRadius: 4,
                  boxShadow: '2px 2px 0 0 #262626',
                }}
              >
                Save Global Settings
              </Button>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <div
              style={{
                background: '#fcfff7',
                border: '1.5px solid #262626',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Title level={5} style={{ marginTop: 0 }}>
                Revenue Split Simulator (1,000,000 ₫ Course)
              </Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Student Pays:</Text>
                  <Text strong>1.000.000 ₫</Text>
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Admin Profit ({defaultRate}%):</Text>
                  <Text strong style={{ color: '#2563eb' }}>
                    {simAdmin.toLocaleString('vi-VN')} ₫
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Lecturer Earnings ({100 - defaultRate}%):</Text>
                  <Text strong style={{ color: '#059669' }}>
                    {simLecturer.toLocaleString('vi-VN')} ₫
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title="Custom Commission Rate by Lecturer"
        style={{ borderRadius: 8 }}
      >
        <Table
          rowKey="id"
          columns={lecturerColumns}
          dataSource={data?.lecturers || []}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 700 }}
        />
      </Card>

      <Card
        title="Custom Commission Rate by Course"
        style={{ borderRadius: 8 }}
      >
        <Table
          rowKey="id"
          columns={courseColumns}
          dataSource={data?.courses || []}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 700 }}
        />
      </Card>
    </Space>
  );
};
