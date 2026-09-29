import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  // Checkbox,
  Card,
  Typography,
  Space,
  Alert,
  Segmented,
  Select,
  Tag,
  App,
  theme,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ReadOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/useAuth';
import type { RegisterRequest } from '../../types/auth.types';
import type { ApiResponse } from '../../types/api';

interface RegisterFormValues {
  full_name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  degree?: string;
  expertise?: string;
  certificates?: string;
  cv_url?: string;
  bio?: string;
  agreement?: boolean;
}

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const RegisterPage: React.FC = () => {
  const { token } = theme.useToken();
  const { register } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (value: string | number) => {
    const selectedRole = value as 'student' | 'lecturer';
    setRole(selectedRole);
    form.setFieldsValue({ role: selectedRole });
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setErrorMessage(null);

    const payload: RegisterRequest = {
      email: values.email.trim(),
      password: values.password,
      full_name: values.full_name.trim(),
      role,
    };

    if (role === 'lecturer') {
      payload.degree = values.degree;
      payload.expertise = values.expertise?.trim();
      payload.certificates = values.certificates?.trim();
      payload.cv_url = values.cv_url?.trim() || undefined;
      payload.bio = values.bio?.trim();
    }

    try {
      await register(payload);
      message.success(
        role === 'lecturer'
          ? 'Lecturer application submitted successfully! Your profile has been sent for review.'
          : 'Student account created successfully! Welcome to EDUTECH.'
      );
      navigate('/');
    } catch (error: unknown) {
      let msg = 'Registration failed. Please check the information provided.';
      if (isAxiosError<ApiResponse>(error)) {
        msg = error.response?.data?.message || error.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: 620,
        backgroundColor: token.colorBgContainer,
        borderColor: token.colorBorder,
        borderRadius: token.borderRadiusLG,
        boxShadow: 'var(--shadow-hard)',
        margin: '12px 0',
      }}
      styles={{
        body: { padding: '36px 32px' },
      }}
    >
      {/* Header Form */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 26, margin: '0 0 6px 0', letterSpacing: -0.5 }}>
          Create New Account
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 14, margin: 0 }}>
          Join our high-quality practical learning and teaching community
        </Paragraph>
      </div>

      {/* Role Selection Switcher */}
      <div style={{ marginBottom: 28 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Which role describes you best?
        </Text>
        <Segmented
          block
          size="large"
          value={role}
          onChange={handleRoleChange}
          options={[
            {
              label: (
                <div style={{ padding: '6px 0' }}>
                  <ReadOutlined style={{ marginRight: 8, color: role === 'student' ? token.colorText : undefined }} />
                  <span style={{ fontWeight: role === 'student' ? 600 : 400 }}>Student</span>
                </div>
              ),
              value: 'student',
            },
            {
              label: (
                <div style={{ padding: '6px 0' }}>
                  <SolutionOutlined style={{ marginRight: 8, color: role === 'lecturer' ? token.colorText : undefined }} />
                  <span style={{ fontWeight: role === 'lecturer' ? 600 : 400 }}>Lecturer</span>
                </div>
              ),
              value: 'lecturer',
            },
          ]}
          style={{
            border: `1px solid ${token.colorBorder}`,
            padding: 4,
            borderRadius: token.borderRadius,
            backgroundColor: token.colorBgLayout,
          }}
        />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          style={{
            marginBottom: 24,
            borderRadius: 4,
            border: `1px solid ${token.colorError}`,
          }}
        />
      )}

      {/* Registration Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'student', agreement: true }}
        requiredMark={false}
      >
        {/* SECTION 1: ACCOUNT INFORMATION */}
        <div style={{ marginBottom: role === 'lecturer' ? 24 : 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: `1px solid ${token.colorBorder}`,
            }}
          >
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
              1. Account Information
            </Text>
            <Tag style={{ borderRadius: 9999, border: `1px solid ${token.colorBorder}` }}>
              Required
            </Tag>
          </div>

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
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="John Doe"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Email Address</Text>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="name@example.com"
                  autoComplete="email"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Password</Text>}
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Confirm Password</Text>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<SafetyCertificateOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* SECTION 2: PROFESSIONAL PROFILE (LECTURER ONLY) */}
        {role === 'lecturer' && (
          <div
            style={{
              marginBottom: 24,
              padding: 20,
              backgroundColor: token.colorBgLayout, // #fcfff7 Cream
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorder}`,
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: `1px solid ${token.colorBorder}`,
              }}
            >
              <Text strong style={{ fontSize: 14, color: token.colorText }}>
                2. Professional Profile & Teaching Expertise
              </Text>
              <Tag
                style={{
                  backgroundColor: '#dcfff1',
                  borderColor: '#7ee2b8',
                  color: '#262626',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                For Lecturers
              </Tag>
            </div>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Highest Degree / Qualification</Text>}
                  name="degree"
                  rules={[{ required: true, message: 'Please select your qualification' }]}
                >
                  <Select
                    size="large"
                    placeholder="Select qualification"
                    style={{ width: '100%', borderRadius: token.borderRadius }}
                  >
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
                  rules={[{ required: true, message: 'Please specify your primary expertise' }]}
                >
                  <Input
                    size="large"
                    placeholder="e.g., Fullstack Web Development, AI, Cloud Computing..."
                    style={{ borderRadius: token.borderRadius }}
                  />
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
              rules={[{ type: 'url', message: 'Invalid URL format (must start with http:// or https://)' }]}
            >
              <Input
                size="large"
                prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="https://linkedin.com/in/... or Google Drive resume link"
                style={{ borderRadius: token.borderRadius }}
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
              <Input
                size="large"
                placeholder="e.g., AWS Solutions Architect, PMP, Google Cloud Professional..."
                style={{ borderRadius: token.borderRadius }}
              />
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
                rows={3}
                placeholder="Briefly summarize your years of experience, teaching methodology, and notable projects..."
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>

            {/* Application Review Notice */}
            <div
              style={{
                backgroundColor: '#dcfff1', // Mint Wash
                border: '1px solid #7ee2b8', // Mint Edge
                borderRadius: 4,
                padding: '12px 16px',
                marginTop: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircleFilled style={{ color: token.colorSuccess, marginTop: 2, fontSize: 16 }} />
                <div style={{ fontSize: 13, color: '#262626', lineHeight: 1.5 }}>
                  <strong>Application Review Process:</strong> After registration, your profile will be
                  verified by the academic board within <strong>24 business hours</strong> to enable course
                  publishing permissions. You can still sign in immediately to explore the course creation workspace.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms Agreement Checkbox */}
        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Please accept the Terms of Service to continue')),
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          {/* <Checkbox style={{ fontSize: 13, color: token.colorTextSecondary }}>
            I agree to the{' '}
            <Link to="/terms" style={{ color: token.colorText, textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: token.colorText, textDecoration: 'underline' }}>
              Privacy Policy
            </Link>{' '}
            of EDUTECH LMS.
          </Checkbox> */}
        </Form.Item>

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            style={{
              height: 46,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {role === 'lecturer' ? 'Submit Lecturer Application' : 'Create Student Account'}
          </Button>
        </Form.Item>
      </Form>

      {/* Footer Switch to Login */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          paddingTop: 20,
          textAlign: 'center',
          fontSize: 14,
        }}
      >
        <Text type="secondary">Already have an account? </Text>
        <Link
          to="/login"
          style={{
            color: token.colorText,
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Sign in here
        </Link>
      </div>
    </Card>
  );
};
