import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Image,
  App,
  theme,
  Row,
  Col,
} from 'antd';
import {
  BookOutlined,
  DollarOutlined,
  LinkOutlined,
  PictureOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { createCourseApi, updateCourseApi } from '../../../api/course.api';
import type {
  Course,
  CourseLevel,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '../../../types/course.types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CourseFormValues {
  title: string;
  level: CourseLevel;
  price: number;
  thumbnail_url?: string;
  description?: string;
}

interface CourseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (course: Course) => void;
  courseToEdit?: Course | null;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  courseToEdit,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [form] = Form.useForm<CourseFormValues>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const isEditing = !!courseToEdit;

  // Điền dữ liệu khi mở modal sửa hoặc reset khi tạo mới
  useEffect(() => {
    if (open) {
      if (courseToEdit) {
        form.setFieldsValue({
          title: courseToEdit.title,
          level: courseToEdit.level,
          price: Number(courseToEdit.price) || 0,
          thumbnail_url: courseToEdit.thumbnail_url || '',
          description: courseToEdit.description || '',
        });
        setThumbnailPreview(courseToEdit.thumbnail_url || '');
      } else {
        form.resetFields();
        setThumbnailPreview('');
      }
    }
  }, [open, courseToEdit, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing && courseToEdit) {
        // Cập nhật khóa học
        const updatePayload: UpdateCourseRequest = {
          title: values.title.trim(),
          level: values.level,
          price: values.price,
          thumbnail_url: values.thumbnail_url?.trim() || null,
          description: values.description?.trim() || null,
        };

        const res = await updateCourseApi(courseToEdit.id, updatePayload);
        if (res.success && res.data) {
          message.success('Course updated successfully!');
          onSuccess(res.data);
          onClose();
        }
      } else {
        // Tạo khóa học mới
        const createPayload: CreateCourseRequest = {
          title: values.title.trim(),
          level: values.level,
          price: values.price,
          thumbnail_url: values.thumbnail_url?.trim() || null,
          description: values.description?.trim() || null,
        };

        const res = await createCourseApi(createPayload);
        if (res.success && res.data) {
          message.success('Course created successfully as draft!');
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof Error && error.message.includes('validate')) {
        // Form validation error caught by AntD, no toast needed
      } else {
        message.error(isEditing ? 'Failed to update course' : 'Failed to create course');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Space align="center" size="small">
          <BookOutlined style={{ color: token.colorText, fontSize: 18 }} />
          <Text strong style={{ fontSize: 18, letterSpacing: -0.3 }}>
            {isEditing ? 'Edit Course Details' : 'Create New Course'}
          </Text>
        </Space>
      }
      onCancel={onClose}
      width={680}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 4 }}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorText,
            border: `1px solid ${token.colorText}`,
            borderRadius: 4,
            fontWeight: 600,
            boxShadow: '1px 1px 0 0 #262626',
          }}
        >
          {isEditing ? 'Save Changes' : 'Create Course'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 20 }}>
        {isEditing
          ? 'Update the course information. The course slug will be updated if you change the title.'
          : 'Provide initial details for your new course. It will be saved as a Draft until you publish it.'}
      </Paragraph>

      <Form form={form} layout="vertical" initialValues={{ level: 'beginner', price: 0 }}>
        {/* Title */}
        <Form.Item
          label={<Text strong>Course Title</Text>}
          name="title"
          rules={[
            { required: true, message: 'Please enter the course title' },
            { min: 5, message: 'Title must be at least 5 characters' },
            { max: 255, message: 'Title cannot exceed 255 characters' },
          ]}
          tooltip="A concise and engaging title for your course."
        >
          <Input
            placeholder="e.g. Master React & Node.js Fullstack Architecture"
            style={{ borderRadius: 4 }}
          />
        </Form.Item>

        {/* Level and Price */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<Text strong>Course Level</Text>}
              name="level"
              rules={[{ required: true, message: 'Please select a level' }]}
            >
              <Select style={{ borderRadius: 4 }}>
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label={<Text strong>Price (VND)</Text>}
              name="price"
              rules={[
                { required: true, message: 'Please enter a price' },
                {
                  type: 'number',
                  min: 0,
                  message: 'Price must be greater than or equal to 0',
                },
              ]}
              tooltip="Set to 0 for a free course."
            >
              <InputNumber<number>
                style={{ width: '100%', borderRadius: 4 }}
                prefix={<DollarOutlined style={{ color: token.colorTextSecondary }} />}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '') || 0)}
                step={50000}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Thumbnail URL & Live Preview */}
        <Form.Item
          label={<Text strong>Thumbnail Image URL</Text>}
          name="thumbnail_url"
          rules={[{ type: 'url', warningOnly: true, message: 'Please enter a valid URL' }]}
          tooltip="Direct link to course cover image (JPEG, PNG, WebP)."
        >
          <Input
            prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
            placeholder="https://example.com/course-cover.jpg"
            onChange={(e) => setThumbnailPreview(e.target.value.trim())}
            style={{ borderRadius: 4 }}
            allowClear
          />
        </Form.Item>

        {/* Live Thumbnail Preview Box */}
        {thumbnailPreview ? (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              borderRadius: 6,
              border: `1px dashed ${token.colorBorder}`,
              backgroundColor: token.colorBgLayout,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Image
              src={thumbnailPreview}
              alt="Thumbnail preview"
              width={120}
              height={70}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="https://placehold.co/120x70?text=Invalid+Image"
            />
            <div>
              <Text strong style={{ fontSize: 13, display: 'block' }}>
                Thumbnail Preview
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                This is how your course cover appears across the catalog.
              </Text>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginBottom: 20,
              padding: '10px 14px',
              borderRadius: 6,
              border: `1px dashed ${token.colorBorder}`,
              backgroundColor: token.colorBgLayout,
            }}
          >
            <Space size="small">
              <PictureOutlined style={{ color: token.colorTextSecondary }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Enter an image URL above to preview the course thumbnail.
              </Text>
            </Space>
          </div>
        )}

        {/* Description */}
        <Form.Item
          label={<Text strong>Course Overview & Description</Text>}
          name="description"
          rules={[{ max: 5000, message: 'Description cannot exceed 5000 characters' }]}
        >
          <TextArea
            rows={4}
            placeholder="Provide a comprehensive summary of what students will learn, prerequisites, and target audience..."
            style={{ borderRadius: 4 }}
            showCount
            maxLength={5000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
