import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Typography, App, theme } from 'antd';
import { FolderOutlined, SaveOutlined } from '@ant-design/icons';
import { isAxiosError } from 'axios';
import { createChapterApi, updateChapterApi } from '../../../api/chapter.api';
import type { Chapter } from '../../../types/chapter.types';

const { Text, Paragraph } = Typography;

interface ChapterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
  chapterToEdit?: Chapter | null;
}

interface ChapterFormValues {
  title: string;
}

export const ChapterModal: React.FC<ChapterModalProps> = ({
  open,
  onClose,
  onSuccess,
  courseId,
  chapterToEdit,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [form] = Form.useForm<ChapterFormValues>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isEditing = !!chapterToEdit;

  useEffect(() => {
    if (open) {
      if (chapterToEdit) {
        form.setFieldsValue({
          title: chapterToEdit.title,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, chapterToEdit, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing && chapterToEdit) {
        const res = await updateChapterApi(chapterToEdit.id, {
          title: values.title.trim(),
        });
        if (res.success) {
          message.success('Chapter updated successfully');
          onSuccess();
          onClose();
        }
      } else {
        const res = await createChapterApi({
          course_id: courseId,
          title: values.title.trim(),
        });
        if (res.success) {
          message.success('Chapter created successfully');
          onSuccess();
          onClose();
        }
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof Error && error.message.includes('validate')) {
        // Form validation error caught by AntD
      } else {
        message.error(isEditing ? 'Failed to update chapter' : 'Failed to create chapter');
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
          <FolderOutlined style={{ color: token.colorText, fontSize: 18 }} />
          <Text strong style={{ fontSize: 18 }}>
            {isEditing ? 'Edit Chapter Title' : 'Add New Chapter'}
          </Text>
        </Space>
      }
      onCancel={onClose}
      destroyOnClose
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
            boxShadow: '1px 1px 0px 0px #262626',
          }}
        >
          {isEditing ? 'Save Changes' : 'Create Chapter'}
        </Button>,
      ]}
    >
      <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 20 }}>
        {isEditing
          ? 'Rename this chapter. All lessons inside this chapter will be preserved.'
          : 'Chapters organize your curriculum into sequential modules or topics.'}
      </Paragraph>

      <Form form={form} layout="vertical">
        <Form.Item
          label={<Text strong>Chapter Title</Text>}
          name="title"
          rules={[
            { required: true, message: 'Please enter a chapter title' },
            { min: 3, message: 'Chapter title must be at least 3 characters' },
            { max: 255, message: 'Chapter title cannot exceed 255 characters' },
          ]}
        >
          <Input
            placeholder="e.g. Chapter 1: Introduction to System Architecture"
            style={{ borderRadius: 4 }}
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
