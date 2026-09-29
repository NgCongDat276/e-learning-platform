import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Avatar,
  Tag,
  Space,
  Alert,
  App,
  theme,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SaveOutlined,
  MailOutlined,
  CheckCircleFilled,
  IdcardOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/useAuth';
import { updateProfileApi, changePasswordApi } from '../../api/user.api';
import type { ApiResponse } from '../../types/api';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../types/user.types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ProfileFormValues {
  full_name: string;
  avatar_url?: string;
  degree?: string;
  expertise?: string;
  cv_url?: string;
  certificates?: string;
  bio?: string;
}

interface ChangePasswordFormValues {
  current_password: string;
  new_password: string;
  confirm_password?: string;
}

export const ProfilePage: React.FC = () => {
  const { token } = theme.useToken();
  const { user, setUser } = useAuth();
  const { message } = App.useApp();

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<ChangePasswordFormValues>();

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync form initial values when user changes
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        full_name: user.full_name,
        avatar_url: user.avatar_url || '',
        degree: user.teacher_profile?.degree || undefined,
        expertise: user.teacher_profile?.expertise || '',
        cv_url: user.teacher_profile?.cv_url || '',
        certificates: user.teacher_profile?.certificates || '',
        bio: user.teacher_profile?.bio || '',
      });
    }
  }, [user, profileForm]);

  // Handle Profile Update
  const handleUpdateProfile = async (values: ProfileFormValues) => {
    setProfileLoading(true);
    setProfileError(null);

    const payload: UpdateProfileRequest = {
      full_name: values.full_name.trim(),
      avatar_url: values.avatar_url?.trim() || null,
    };

    if (user?.role === 'lecturer') {
      payload.degree = values.degree || null;
      payload.expertise = values.expertise?.trim() || null;
      payload.cv_url = values.cv_url?.trim() || null;
      payload.certificates = values.certificates?.trim() || null;
      payload.bio = values.bio?.trim() || null;
    }

    try {
      const response = await updateProfileApi(payload);
      if (response.success && response.data) {
        setUser(response.data);
        message.success('Profile updated successfully!');
      }
    } catch (error: unknown) {
      let msg = 'Failed to update profile. Please try again.';
      if (isAxiosError<ApiResponse>(error)) {
        msg = error.response?.data?.message || error.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    setPasswordLoading(true);
    setPasswordError(null);

    const payload: ChangePasswordRequest = {
      current_password: values.current_password,
      new_password: values.new_password,
    };

    try {
      const response = await changePasswordApi(payload);
      if (response.success) {
        message.success('Password changed successfully! Please use your new password next time.');
        passwordForm.resetFields();
      }
    } catch (error: unknown) {
      let msg = 'Failed to change password. Please check your current password.';
      if (isAxiosError<ApiResponse>(error)) {
        msg = error.response?.data?.message || error.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarUrlWatch = Form.useWatch('avatar_url', profileForm);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: '0 0 6px 0', letterSpacing: -0.5 }}>
          Account Settings
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 15 }}>
          Manage your personal profile, credentials, and security preferences.
        </Paragraph>
      </div>

      {/* User Info Overview Card */}
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorder,
          borderRadius: token.borderRadiusLG,
          boxShadow: 'var(--shadow-hard)',
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Space orientation="horizontal" size="middle" align="center">
            <Avatar
              size={64}
              src={avatarUrlWatch || user?.avatar_url || undefined}
              style={{
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                fontSize: 26,
                fontWeight: 700,
                border: `2px solid ${token.colorBorder}`,
              }}
            >
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <div>
              <Space size={8} align="center">
                <Title level={4} style={{ margin: 0 }}>
                  {user?.full_name}
                </Title>
                <Tag
                  style={{
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    borderRadius: 9999,
                    backgroundColor: token.colorBgLayout,
                    borderColor: token.colorBorder,
                  }}
                >
                  {user?.role}
                </Tag>
              </Space>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                <MailOutlined style={{ marginRight: 6 }} />
                {user?.email}
              </Text>
            </div>
          </Space>

          <Space size="small">
            <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 9999, padding: '2px 10px' }}>
              Account Active
            </Tag>
          </Space>
        </div>
      </Card>

      {/* Main Settings Tabs */}
      <Card
        style={{
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorder,
          borderRadius: token.borderRadiusLG,
          boxShadow: 'var(--shadow-hard)',
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: (
                <span>
                  <IdcardOutlined style={{ marginRight: 8 }} />
                  Personal Profile
                </span>
              ),
              children: (
                <div style={{ maxWidth: 720, paddingTop: 12 }}>
                  {profileError && (
                    <Alert
                      message={profileError}
                      type="error"
                      showIcon
                      style={{ marginBottom: 20 }}
                    />
                  )}

                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    requiredMark={false}
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={<Text strong>Full Name</Text>}
                          name="full_name"
                          rules={[
                            { required: true, message: 'Please enter your full name' },
                            { min: 2, message: 'Full name must be at least 2 characters' },
                          ]}
                        >
                          <Input size="large" prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />} />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label={<Text strong>Email Address</Text>}>
                          <Input
                            size="large"
                            value={user?.email}
                            disabled
                            prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label={
                        <Space size={4}>
                          <Text strong>Avatar Image URL</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>(Direct link to photo)</Text>
                        </Space>
                      }
                      name="avatar_url"
                      rules={[{ type: 'url', message: 'Please enter a valid image URL (http:// or https://)' }]}
                    >
                      <Input
                        size="large"
                        prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                        placeholder="https://images.unsplash.com/... or cloud avatar URL"
                      />
                    </Form.Item>

                    {/* Teacher profile section if role is lecturer */}
                    {user?.role === 'lecturer' && (
                      <>
                        <Divider titlePlacement="left" style={{ margin: '24px 0 20px 0' }}>
                          <Text strong style={{ fontSize: 14 }}>
                            Teaching & Academic Credentials
                          </Text>
                        </Divider>

                        <Row gutter={[16, 0]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<Text strong>Highest Degree / Qualification</Text>}
                              name="degree"
                            >
                              <Select size="large" placeholder="Select degree">
                                <Option value="Bachelor's Degree">Bachelor's Degree</Option>
                                <Option value="Engineer's Degree">Engineer's Degree</Option>
                                <Option value="Master's Degree">Master's Degree</Option>
                                <Option value="Ph.D. / Doctorate">Ph.D. / Doctorate</Option>
                                <Option value="Professor / Associate Professor">Professor / Associate Professor</Option>
                                <Option value="Industry Expert">Industry Expert</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<Text strong>Primary Expertise</Text>}
                              name="expertise"
                            >
                              <Input size="large" placeholder="e.g. AI, Fullstack, Cloud..." />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          label={
                            <Space size={4}>
                              <Text strong>CV / Portfolio / LinkedIn URL</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                            </Space>
                          }
                          name="cv_url"
                          rules={[{ type: 'url', message: 'Invalid URL format' }]}
                        >
                          <Input
                            size="large"
                            prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </Form.Item>

                        <Form.Item
                          label={
                            <Space size={4}>
                              <Text strong>Professional Certifications</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                            </Space>
                          }
                          name="certificates"
                        >
                          <Input size="large" placeholder="e.g. AWS Solutions Architect, PMP..." />
                        </Form.Item>

                        <Form.Item
                          label={
                            <Space size={4}>
                              <Text strong>Bio & Teaching Experience</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                            </Space>
                          }
                          name="bio"
                        >
                          <Input.TextArea
                            rows={4}
                            placeholder="Briefly describe your background, teaching philosophy, and achievements..."
                          />
                        </Form.Item>
                      </>
                    )}

                    <Form.Item style={{ marginTop: 24 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={profileLoading}
                        icon={<SaveOutlined />}
                        style={{ height: 44, padding: '0 28px', fontWeight: 600 }}
                      >
                        Save Profile Changes
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'security',
              label: (
                <span>
                  <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                  Security & Password
                </span>
              ),
              children: (
                <div style={{ maxWidth: 520, paddingTop: 12 }}>
                  {passwordError && (
                    <Alert
                      message={passwordError}
                      type="error"
                      showIcon
                      style={{ marginBottom: 20 }}
                    />
                  )}

                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    requiredMark={false}
                  >
                    <Form.Item
                      label={<Text strong>Current Password</Text>}
                      name="current_password"
                      rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text strong>New Password</Text>}
                      name="new_password"
                      rules={[
                        { required: true, message: 'Please enter a new password' },
                        { min: 8, message: 'New password must be at least 8 characters' },
                      ]}
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text strong>Confirm New Password</Text>}
                      name="confirm_password"
                      dependencies={['new_password']}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('new_password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={passwordLoading}
                        icon={<SaveOutlined />}
                        style={{ height: 44, padding: '0 28px', fontWeight: 600 }}
                      >
                        Update Password
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
