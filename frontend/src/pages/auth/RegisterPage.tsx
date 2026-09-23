import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Checkbox,
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
import { useAuth } from '../../context/AuthContext';
import type { RegisterRequest } from '../../types/auth.types';

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

  const handleSubmit = async (values: any) => {
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
          ? 'Đăng ký hồ sơ Giảng viên thành công! Hồ sơ đã gửi đến ban học thuật.'
          : 'Đăng ký tài khoản Học viên thành công! Chào mừng bạn gia nhập EDUTECH.'
      );
      navigate('/');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin đã điền.';
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
          Đăng ký tài khoản mới
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 14, margin: 0 }}>
          Tham gia cộng đồng học tập và giảng dạy thực chiến chất lượng cao
        </Paragraph>
      </div>

      {/* Role Selection Switcher */}
      <div style={{ marginBottom: 28 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Bạn muốn tham gia hệ thống với vai trò nào?
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
                  <span style={{ fontWeight: role === 'student' ? 600 : 400 }}>Học viên (Student)</span>
                </div>
              ),
              value: 'student',
            },
            {
              label: (
                <div style={{ padding: '6px 0' }}>
                  <SolutionOutlined style={{ marginRight: 8, color: role === 'lecturer' ? token.colorText : undefined }} />
                  <span style={{ fontWeight: role === 'lecturer' ? 600 : 400 }}>Giảng viên (Lecturer)</span>
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
        {/* SECTION 1: THÔNG TIN TÀI KHOẢN CỐT LÕI */}
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
              1. Thông tin tài khoản đăng nhập
            </Text>
            <Tag style={{ borderRadius: 9999, border: `1px solid ${token.colorBorder}` }}>
              Bắt buộc
            </Tag>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Họ và tên</Text>}
                name="full_name"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên của bạn' },
                  { min: 2, message: 'Họ và tên tối thiểu 2 ký tự' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="Nguyễn Văn A"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Địa chỉ Email</Text>}
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập địa chỉ email' },
                  { type: 'email', message: 'Email không hợp lệ' },
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
                label={<Text strong>Mật khẩu</Text>}
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Xác nhận mật khẩu</Text>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận lại mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<SafetyCertificateOutlined style={{ color: token.colorTextSecondary }} />}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  style={{ borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* SECTION 2: HỒ SƠ CHUYÊN MÔN (CHỈ HIỂN THỊ KHI ROLE LÀ LECTURER) */}
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
                2. Hồ sơ năng lực & Chuyên môn giảng dạy
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
                Dành cho Giảng viên
              </Tag>
            </div>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Học vị / Bằng cấp cao nhất</Text>}
                  name="degree"
                  rules={[{ required: true, message: 'Vui lòng chọn học vị hoặc bằng cấp' }]}
                >
                  <Select
                    size="large"
                    placeholder="Chọn bằng cấp"
                    style={{ width: '100%', borderRadius: token.borderRadius }}
                  >
                    <Option value="Cử nhân">Cử nhân (Bachelor)</Option>
                    <Option value="Kỹ sư">Kỹ sư (Engineer)</Option>
                    <Option value="Thạc sĩ">Thạc sĩ (Master)</Option>
                    <Option value="Tiến sĩ">Tiến sĩ (Ph.D)</Option>
                    <Option value="Giáo sư / Phó Giáo sư">Giáo sư / Phó Giáo sư</Option>
                    <Option value="Chuyên gia doanh nghiệp">Chuyên gia doanh nghiệp (Industry Expert)</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Lĩnh vực chuyên môn chính</Text>}
                  name="expertise"
                  rules={[{ required: true, message: 'Vui lòng nhập chuyên môn của bạn' }]}
                >
                  <Input
                    size="large"
                    placeholder="VD: Web Fullstack, AI, Mobile Dev..."
                    style={{ borderRadius: token.borderRadius }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={
                <Space size={4}>
                  <Text strong>Liên kết CV / Portfolio / LinkedIn</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>(Tùy chọn)</Text>
                </Space>
              }
              name="cv_url"
              rules={[{ type: 'url', message: 'Đường dẫn URL không hợp lệ (cần có http:// hoặc https://)' }]}
            >
              <Input
                size="large"
                prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="https://linkedin.com/in/... hoặc link Drive hồ sơ"
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>

            <Form.Item
              label={
                <Space size={4}>
                  <Text strong>Chứng chỉ chuyên môn nổi bật</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>(Tùy chọn)</Text>
                </Space>
              }
              name="certificates"
            >
              <Input
                size="large"
                placeholder="VD: AWS Solutions Architect, PMP, IELTS 8.0, Google Professional Cloud Developer..."
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>

            <Form.Item
              label={
                <Space size={4}>
                  <Text strong>Tiểu sử & Kinh nghiệm giảng dạy</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>(Tùy chọn)</Text>
                </Space>
              }
              name="bio"
            >
              <Input.TextArea
                rows={3}
                placeholder="Tóm tắt ngắn gọn số năm kinh nghiệm, phương pháp giảng dạy và những dự án bạn từng triển khai..."
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>

            {/* Thông báo quy trình xét duyệt hồ sơ Giảng viên */}
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
                  <strong>Quy trình xét duyệt hồ sơ:</strong> Sau khi đăng ký thành công, hồ sơ của bạn sẽ
                  được ban học thuật xác thực trong vòng <strong>24 giờ làm việc</strong> để mở quyền xuất bản
                  khóa học. Bạn vẫn có thể đăng nhập ngay để làm quen với giao diện soạn bài giảng.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkbox Đồng ý điều khoản */}
        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Vui lòng chấp nhận Điều khoản dịch vụ để tiếp tục')),
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Checkbox style={{ fontSize: 13, color: token.colorTextSecondary }}>
            Tôi đồng ý với{' '}
            <Link to="/terms" style={{ color: token.colorText, textDecoration: 'underline' }}>
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" style={{ color: token.colorText, textDecoration: 'underline' }}>
              Chính sách bảo mật
            </Link>{' '}
            của EDUTECH LMS.
          </Checkbox>
        </Form.Item>

        {/* Nút bấm Submit */}
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
            {role === 'lecturer' ? 'Gửi hồ sơ đăng ký giảng viên' : 'Đăng ký tài khoản học ngay'}
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
        <Text type="secondary">Đã có tài khoản trên hệ thống? </Text>
        <Link
          to="/login"
          style={{
            color: token.colorText,
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Đăng nhập ngay
        </Link>
      </div>
    </Card>
  );
};
