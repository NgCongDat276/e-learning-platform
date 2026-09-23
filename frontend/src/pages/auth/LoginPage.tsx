import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Typography, Alert, App, theme } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import type { LoginRequest } from '../../types/auth.types';

const { Title, Text, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const { token } = theme.useToken();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      message.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
      navigate('/');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: 460,
        backgroundColor: token.colorBgContainer,
        borderColor: token.colorBorder,
        borderRadius: token.borderRadiusLG,
        boxShadow: 'var(--shadow-hard)',
      }}
      styles={{
        body: { padding: '36px 32px' },
      }}
    >
      {/* Header Form */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: token.colorPrimary,
            border: `1px solid ${token.colorText}`,
            boxShadow: '1px 1px 0px 0px #262626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <LoginOutlined style={{ fontSize: 24, color: token.colorText }} />
        </div>

        <Title level={2} style={{ fontSize: 26, margin: '0 0 6px 0', letterSpacing: -0.5 }}>
          Đăng nhập tài khoản
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 14, margin: 0 }}>
          Nhập thông tin xác thực để tiếp tục phiên học tập của bạn
        </Paragraph>
      </div>

      {/* Error Alert nếu có lỗi */}
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

      {/* Form Đăng Nhập */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ remember: true }}
        requiredMark={false}
      >
        <Form.Item
          label={<Text strong>Địa chỉ Email</Text>}
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập địa chỉ email của bạn' },
            { type: 'email', message: 'Địa chỉ email không đúng định dạng' },
          ]}
        >
          <Input
            size="large"
            prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
            placeholder="example@domain.com"
            autoComplete="email"
            style={{ borderRadius: token.borderRadius }}
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Mật khẩu</Text>}
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu của bạn' }]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ borderRadius: token.borderRadius }}
          />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ fontSize: 13, color: token.colorTextSecondary }}>
              Ghi nhớ đăng nhập
            </Checkbox>
          </Form.Item>

          <Link
            to="/forgot-password"
            style={{
              fontSize: 13,
              color: token.colorText,
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            Quên mật khẩu?
          </Link>
        </div>

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
            Đăng nhập vào hệ thống
          </Button>
        </Form.Item>
      </Form>

      {/* Footer Switch to Register */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          paddingTop: 20,
          textAlign: 'center',
          fontSize: 14,
        }}
      >
        <Text type="secondary">Chưa có tài khoản trên EDUTECH? </Text>
        <Link
          to="/register"
          style={{
            color: token.colorText,
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Đăng ký ngay
        </Link>
      </div>
    </Card>
  );
};
