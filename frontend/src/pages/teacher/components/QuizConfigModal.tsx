import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  Select,
  Card,
  theme,
  message,
  Spin,
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  BookOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  getLessonQuizApi,
  upsertLessonQuizApi,
  getCourseQuestionBanksApi,
} from '../../../api/quiz.api';
import type {
  QuestionBank,
  QuizQuestionRule,
  UpsertQuizConfigRequest,
} from '../../../types/quiz.types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface QuizConfigModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  onSuccess?: () => void;
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  open,
  onClose,
  lessonId,
  lessonTitle,
  courseId,
  onSuccess,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [banks, setBanks] = useState<QuestionBank[]>([]);

  // 1. Load available question banks & current quiz configuration
  useEffect(() => {
    if (!open || !lessonId || !courseId) return;

    let isMounted = true;
    Promise.all([
      getCourseQuestionBanksApi(courseId),
      getLessonQuizApi(lessonId),
    ])
      .then(([banksRes, quizRes]) => {
        if (!isMounted) return;
        if (banksRes.success && banksRes.data) {
          setBanks(banksRes.data);
        }

        if (quizRes.success && quizRes.data?.quiz) {
          const q = quizRes.data.quiz;
          form.setFieldsValue({
            title: q.title || lessonTitle,
            description: q.description || '',
            passing_score: q.passing_score ?? 60,
            time_limit_minutes: q.time_limit_minutes ?? 15,
            max_attempts: q.max_attempts ?? 1,
            shuffle_questions: q.shuffle_questions ?? true,
            shuffle_options: q.shuffle_options ?? true,
            show_correct_answers: q.show_correct_answers ?? false,
            rules:
              q.rules && q.rules.length > 0
                ? q.rules.map((r) => ({
                    bank_id: r.bank_id,
                    question_count: r.question_count,
                    difficulty: r.difficulty || undefined,
                    topic: r.topic || '',
                    points_per_question: r.points_per_question ?? 1,
                  }))
                : [],
          });
        } else {
          // Default values for newly configured quiz
          form.setFieldsValue({
            title: lessonTitle,
            description: 'Reinforce chapter concepts with this assessment check.',
            passing_score: 60,
            time_limit_minutes: 15,
            max_attempts: 1,
            shuffle_questions: true,
            shuffle_options: true,
            show_correct_answers: false,
            rules: [],
          });
        }
      })
      .catch(() => {
        if (isMounted) message.error('Failed to load quiz settings or question banks');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, lessonId, courseId, lessonTitle, form]);

  // 2. Submit / Save configuration
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: UpsertQuizConfigRequest = {
        title: values.title,
        description: values.description || null,
        passing_score: values.passing_score,
        time_limit_minutes: values.time_limit_minutes,
        max_attempts: values.max_attempts,
        shuffle_questions: values.shuffle_questions,
        shuffle_options: values.shuffle_options,
        show_correct_answers: values.show_correct_answers,
        rules: (values.rules || []).map((r: QuizQuestionRule) => ({
          bank_id: r.bank_id,
          question_count: r.question_count,
          difficulty: r.difficulty || null,
          topic: r.topic || null,
          points_per_question: r.points_per_question || 1,
        })),
      };

      const res = await upsertLessonQuizApi(lessonId, payload);
      if (res.success) {
        message.success('Quiz assessment configuration saved successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        message.error(res.message || 'Failed to save quiz configuration');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return; // validation error
      }
      message.error('Error saving quiz settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingOutlined style={{ color: '#2563eb', fontSize: 16 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 17 }}>
              Configure Quiz Assessment
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {lessonTitle}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 4 }}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => void handleSave()}
          style={{
            borderRadius: 4,
            fontWeight: 700,
            backgroundColor: token.colorPrimary,
            color: '#262626',
            borderColor: '#262626',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          Save Assessment Rules
        </Button>,
      ]}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <Paragraph type="secondary" style={{ marginTop: 12 }}>
            Loading quiz configuration & banks...
          </Paragraph>
        </div>
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* General Metadata */}
          <Form.Item
            name="title"
            label={<Text strong>Assessment Title</Text>}
            rules={[{ required: true, message: 'Please enter assessment title' }]}
          >
            <Input placeholder="e.g. Diagnostic JavaScript Mastery Check" style={{ borderRadius: 4 }} />
          </Form.Item>

          <Form.Item name="description" label={<Text strong>Assessment Instructions / Overview</Text>}>
            <Input.TextArea
              rows={2}
              placeholder="Instructions shown to students before beginning..."
              style={{ borderRadius: 4 }}
            />
          </Form.Item>

          {/* Benchmark Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Form.Item
              name="passing_score"
              label={<Text strong>Passing Score (%)</Text>}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%', borderRadius: 4 }} addonAfter="%" />
            </Form.Item>

            <Form.Item
              name="time_limit_minutes"
              label={
                <Text strong>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> Time Limit (Min)
                </Text>
              }
              extra={<Text type="secondary" style={{ fontSize: 11 }}>0 = Untimed</Text>}
            >
              <InputNumber min={0} max={300} style={{ width: '100%', borderRadius: 4 }} addonAfter="min" />
            </Form.Item>

            <Form.Item
              name="max_attempts"
              label={<Text strong>Allowed Attempts</Text>}
              extra={<Text type="secondary" style={{ fontSize: 11 }}>0 = Unlimited</Text>}
            >
              <InputNumber min={0} max={50} style={{ width: '100%', borderRadius: 4 }} />
            </Form.Item>
          </div>

          {/* Behavior Toggles */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: token.colorBgLayout,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ display: 'block', fontSize: 14 }}>
                  Randomize Question Sequence
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Shuffle the order of questions for each student attempt to minimize plagiarism
                </Text>
              </div>
              <Form.Item name="shuffle_questions" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ display: 'block', fontSize: 14 }}>
                  Randomize Choice Options
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Shuffle multiple-choice option items per question
                </Text>
              </div>
              <Form.Item name="shuffle_options" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ display: 'block', fontSize: 14 }}>
                  Reveal Correct Answers on Completion
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Allow students to review correct options and concept keys after submission
                </Text>
              </div>
              <Form.Item name="show_correct_answers" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
          </div>

          {/* Question Rules Section */}
          <Divider orientation="left" style={{ margin: '16px 0 20px 0' }}>
            <Space size="small">
              <BookOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: 14 }}>
                Question Sourcing Rules (from Question Banks)
              </Text>
            </Space>
          </Divider>

          {banks.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#92400e', fontSize: 13, display: 'block', marginBottom: 6 }}>
                ⚠️ No Question Banks created for this course yet!
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Please create a Question Bank from the "Question Banks" button in the Curriculum
                Builder header before binding specific rules.
              </Text>
            </div>
          ) : null}

          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 6,
                      backgroundColor: token.colorBgContainer,
                    }}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        size="small"
                      >
                        Remove Rule
                      </Button>
                    }
                    title={
                      <Text strong style={{ fontSize: 13 }}>
                        Rule #{name + 1}
                      </Text>
                    }
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: 12,
                      }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'bank_id']}
                        label={<Text style={{ fontSize: 12 }}>Target Bank</Text>}
                        rules={[{ required: true, message: 'Bank required' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select placeholder="Select bank" style={{ borderRadius: 4 }}>
                          {banks.map((b) => (
                            <Option key={b.id} value={b.id}>
                              {b.title} ({b.questions_count || 0} Qs)
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'question_count']}
                        label={<Text style={{ fontSize: 12 }}>Pick Qs Count</Text>}
                        rules={[{ required: true, message: 'Count required' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} max={50} style={{ width: '100%', borderRadius: 4 }} />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'difficulty']}
                        label={<Text style={{ fontSize: 12 }}>Difficulty</Text>}
                        style={{ marginBottom: 0 }}
                      >
                        <Select placeholder="Any Level" allowClear style={{ borderRadius: 4 }}>
                          <Option value="easy">Easy</Option>
                          <Option value="medium">Medium</Option>
                          <Option value="hard">Hard</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'points_per_question']}
                        label={<Text style={{ fontSize: 12 }}>Pts / Question</Text>}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} max={100} style={{ width: '100%', borderRadius: 4 }} />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ question_count: 5, points_per_question: 1 })}
                  icon={<PlusOutlined />}
                  disabled={banks.length === 0}
                  style={{
                    borderRadius: 4,
                    borderColor: token.colorBorder,
                    fontWeight: 600,
                  }}
                >
                  Add Question Bank Sourcing Rule
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      )}
    </Modal>
  );
};
