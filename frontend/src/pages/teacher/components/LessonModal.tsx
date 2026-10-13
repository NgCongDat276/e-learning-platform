import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  Space,
  Typography,
  Progress,
  Upload,
  Alert,
  App,
  theme,
  Row,
  Col,
} from 'antd';
import {
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
  CheckCircleFilled,
  SaveOutlined,
  LinkOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { createLessonApi, updateLessonApi } from '../../../api/lesson.api';
import { getPresignedUrlApi, uploadFileToR2Api } from '../../../api/upload.api';
import type { Lesson, LessonType } from '../../../types/lesson.types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface LessonModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chapterId: string;
  chapterTitle?: string;
  lessonToEdit?: Lesson | null;
}

interface LessonFormValues {
  title: string;
  lesson_type: LessonType;
  content_url?: string;
  lesson_content?: string;
  duration_minutes?: number;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  open,
  onClose,
  onSuccess,
  chapterId,
  chapterTitle,
  lessonToEdit,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [form] = Form.useForm<LessonFormValues>();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const watchedType = Form.useWatch('lesson_type', form);
  const contentUrl = Form.useWatch('content_url', form);
  const selectedType: LessonType = (watchedType as LessonType) || lessonToEdit?.lesson_type || 'video';

  // Cloudflare R2 Upload states
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const isEditing = !!lessonToEdit;

  useEffect(() => {
    if (open) {
      if (lessonToEdit) {
        form.setFieldsValue({
          title: lessonToEdit.title,
          lesson_type: lessonToEdit.lesson_type,
          content_url: lessonToEdit.content_url || '',
          lesson_content: lessonToEdit.lesson_content || '',
          duration_minutes: lessonToEdit.duration_seconds
            ? Math.ceil(lessonToEdit.duration_seconds / 60)
            : 0,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          lesson_type: 'video',
          duration_minutes: 10,
        });
      }
    }
  }, [open, lessonToEdit, form]);

  const handleClose = () => {
    setUploadedFileName('');
    setUploadProgress(0);
    onClose();
  };

  // Xử lý upload file thẳng lên Cloudflare R2 qua Presigned URL
  const handleUploadR2 = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    try {
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';
      const folder = isVideo ? 'lessons/videos' : isPdf ? 'lessons/documents' : 'lessons/videos';

      // 1. Lấy Presigned URL từ backend
      const presignedRes = await getPresignedUrlApi({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder,
        fileSize: file.size,
      });

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error('Failed to obtain presigned upload URL from server');
      }

      const { uploadUrl, fileUrl } = presignedRes.data;

      // 2. Upload trực tiếp file lên Cloudflare R2
      await uploadFileToR2Api(uploadUrl, file, (percent) => {
        setUploadProgress(percent);
      });

      // 3. Cập nhật URL vào form
      form.setFieldsValue({ content_url: fileUrl });
      message.success(`File "${file.name}" uploaded successfully to Cloudflare R2!`);

      // 4. Nếu là video, tự động phát hiện độ dài (duration)
      if (isVideo) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.src = URL.createObjectURL(file);
        videoElement.onloadedmetadata = () => {
          URL.revokeObjectURL(videoElement.src);
          const durationSeconds = Math.round(videoElement.duration);
          if (durationSeconds > 0) {
            form.setFieldsValue({
              duration_minutes: Math.ceil(durationSeconds / 60),
            });
          }
        };
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to upload file to Cloudflare R2');
      }
      setUploadedFileName('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const durationSeconds = values.duration_minutes
        ? Math.round(values.duration_minutes * 60)
        : 0;

      const payload = {
        title: values.title.trim(),
        lesson_type: values.lesson_type,
        content_url: values.content_url?.trim() || null,
        lesson_content: values.lesson_content?.trim() || null,
        duration_seconds: durationSeconds,
      };

      if (isEditing && lessonToEdit) {
        const res = await updateLessonApi(lessonToEdit.id, payload);
        if (res.success) {
          message.success('Lesson updated successfully');
          onSuccess();
          handleClose();
        }
      } else {
        const res = await createLessonApi({
          chapter_id: chapterId,
          ...payload,
        });
        if (res.success) {
          message.success('Lesson created successfully');
          onSuccess();
          handleClose();
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof Error && error.message.includes('validate')) {
        // Form validation error caught by AntD
      } else {
        message.error(isEditing ? 'Failed to update lesson' : 'Failed to create lesson');
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
          <PlayCircleOutlined style={{ color: token.colorText, fontSize: 18 }} />
          <Text strong style={{ fontSize: 18 }}>
            {isEditing ? 'Edit Lesson' : `Add Lesson to Chapter`}
          </Text>
        </Space>
      }
      onCancel={handleClose}
      destroyOnClose
      width={680}
      footer={[
        <Button key="cancel" onClick={handleClose} style={{ borderRadius: 4 }}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={submitting || uploading}
          onClick={handleSubmit}
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorText,
            border: `1px solid ${token.colorText}`,
            borderRadius: 4,
            fontWeight: 600,
            boxShadow: '1px 1px 0px 0px #262626',
          }}
        >
          {isEditing ? 'Save Changes' : 'Create Lesson'}
        </Button>,
      ]}
    >
      <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 18 }}>
        {chapterTitle ? (
          <>
            Belongs to chapter: <Text strong>{chapterTitle}</Text>
          </>
        ) : (
          'Configure lesson type, media assets on Cloudflare R2, and content.'
        )}
      </Paragraph>

      <Form form={form} layout="vertical" initialValues={{ lesson_type: 'video', duration_minutes: 10 }}>
        {/* Title */}
        <Form.Item
          label={<Text strong>Lesson Title</Text>}
          name="title"
          rules={[
            { required: true, message: 'Please enter the lesson title' },
            { min: 3, message: 'Title must be at least 3 characters' },
            { max: 255, message: 'Title cannot exceed 255 characters' },
          ]}
        >
          <Input placeholder="e.g. Setting Up Prisma ORM & Database Schemas" style={{ borderRadius: 4 }} />
        </Form.Item>

        {/* Lesson Type */}
        <Form.Item label={<Text strong>Lesson Format</Text>} name="lesson_type">
          <Radio.Group
            style={{ width: '100%', display: 'flex', gap: 12 }}
          >
            <Radio.Button
              value="video"
              style={{
                flex: 1,
                textAlign: 'center',
                height: 42,
                lineHeight: '40px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              <PlayCircleOutlined style={{ marginRight: 6 }} /> Video Lecture
            </Radio.Button>
            <Radio.Button
              value="text"
              style={{
                flex: 1,
                textAlign: 'center',
                height: 42,
                lineHeight: '40px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              <FileTextOutlined style={{ marginRight: 6 }} /> Reading Article / PDF
            </Radio.Button>
            <Radio.Button
              value="quiz"
              style={{
                flex: 1,
                textAlign: 'center',
                height: 42,
                lineHeight: '40px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              <QuestionCircleOutlined style={{ marginRight: 6 }} /> Quiz Assessment
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Type 1: Video Lecture */}
        {selectedType === 'video' && (
          <div
            style={{
              padding: 16,
              borderRadius: 6,
              backgroundColor: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              marginBottom: 20,
            }}
          >
            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
              Video Media (Cloudflare R2 Direct Upload)
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
              Upload video files (.mp4, .webm, .mov) directly to Cloudflare R2 bucket.
            </Paragraph>

            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                void handleUploadR2(file);
                return false;
              }}
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                style={{
                  borderRadius: 4,
                  fontWeight: 600,
                  backgroundColor: token.colorBgContainer,
                }}
              >
                {uploading ? 'Uploading to R2...' : 'Select Video File to Upload'}
              </Button>
            </Upload>

            {uploading && (
              <div style={{ marginTop: 12 }}>
                <Progress percent={uploadProgress} strokeColor={token.colorPrimary} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Uploading {uploadedFileName} ({uploadProgress}%)
                </Text>
              </div>
            )}

            {!!(uploadedFileName || contentUrl) && !uploading && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleFilled style={{ color: '#059669' }} />
                <Text style={{ fontSize: 12 }}>
                  {uploadedFileName ? `Ready: ${uploadedFileName}` : 'Linked Media File Available'}
                </Text>
              </div>
            )}

            <Form.Item
              label={<Text strong style={{ marginTop: 12, display: 'block' }}>Video Content URL</Text>}
              name="content_url"
              tooltip="Direct URL to Cloudflare R2 video file or external video source."
              style={{ marginTop: 12, marginBottom: 8 }}
            >
              <Input
                prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="https://pub-xxxxxx.r2.dev/lessons/videos/lesson.mp4"
                style={{ borderRadius: 4 }}
                allowClear
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<Text strong>Estimated Duration (Minutes)</Text>}
                  name="duration_minutes"
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    min={0}
                    step={1}
                    prefix={<ClockCircleOutlined style={{ color: token.colorTextSecondary }} />}
                    style={{ width: '100%', borderRadius: 4 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Type 2: Reading / Text */}
        {selectedType === 'text' && (
          <div
            style={{
              padding: 16,
              borderRadius: 6,
              backgroundColor: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              marginBottom: 20,
            }}
          >
            <Form.Item
              label={<Text strong>Reading Article Content (Markdown / Text)</Text>}
              name="lesson_content"
            >
              <TextArea
                rows={6}
                placeholder="Write lesson notes, architecture walkthrough, or code explanations..."
                style={{ borderRadius: 4 }}
              />
            </Form.Item>

            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              Optional PDF Attachment (Cloudflare R2)
            </Text>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                void handleUploadR2(file);
                return false;
              }}
              accept="application/pdf,.pdf"
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                size="small"
                style={{ borderRadius: 4 }}
              >
                Upload PDF Document
              </Button>
            </Upload>

            {uploading && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={uploadProgress} strokeColor={token.colorPrimary} size="small" />
              </div>
            )}

            <Form.Item
              label={<Text strong style={{ marginTop: 10, display: 'block' }}>Document Attachment URL</Text>}
              name="content_url"
              style={{ marginTop: 10, marginBottom: 0 }}
            >
              <Input
                prefix={<LinkOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="https://pub-xxxxxx.r2.dev/lessons/documents/slide.pdf"
                style={{ borderRadius: 4 }}
                allowClear
              />
            </Form.Item>
          </div>
        )}

        {/* Type 3: Quiz Assessment */}
        {selectedType === 'quiz' && (
          <Alert
            type="info"
            showIcon
            icon={<QuestionCircleOutlined />}
            message="Quiz Assessment Linked"
            description="This lesson will serve as a diagnostic check. You can configure question banks, time limits, and multiple-choice options under Module 6 (Quizzes & Question Bank)."
            style={{ marginBottom: 20, borderRadius: 6 }}
          />
        )}
      </Form>
    </Modal>
  );
};
