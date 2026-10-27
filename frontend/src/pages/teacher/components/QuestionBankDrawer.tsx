import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Typography,
  Button,
  Space,
  Tag,
  Card,
  Empty,
  Spin,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  Tooltip,
  theme,
  message,
} from 'antd';
import {
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import {
  getCourseQuestionBanksApi,
  getQuestionBankByIdApi,
  createQuestionBankApi,
  updateQuestionBankApi,
  deleteQuestionBankApi,
  createBankQuestionApi,
  updateBankQuestionApi,
  deleteBankQuestionApi,
} from '../../../api/quiz.api';
import type {
  QuestionBank,
  BankQuestion,
  CreateBankQuestionRequest,
  UpdateBankQuestionRequest,
  QuestionType,
  QuestionDifficulty,
} from '../../../types/quiz.types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface QuestionBankDrawerProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export const QuestionBankDrawer: React.FC<QuestionBankDrawerProps> = ({
  open,
  onClose,
  courseId,
  courseTitle,
}) => {
  const { token } = theme.useToken();

  // Primary list state
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState<boolean>(true);

  // Selected bank detail state (Drill-down view)
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Bank Form Modal (Create / Edit Bank)
  const [bankModalOpen, setBankModalOpen] = useState<boolean>(false);
  const [bankToEdit, setBankToEdit] = useState<QuestionBank | null>(null);
  const [savingBank, setSavingBank] = useState<boolean>(false);
  const [bankForm] = Form.useForm();

  // Question Form Modal (Create / Edit Question)
  const [questionModalOpen, setQuestionModalOpen] = useState<boolean>(false);
  const [questionToEdit, setQuestionToEdit] = useState<BankQuestion | null>(null);
  const [savingQuestion, setSavingQuestion] = useState<boolean>(false);
  const [questionForm] = Form.useForm();
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>('single_choice');

  // 1. Fetch Banks List
  const fetchBanks = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoadingBanks(true);
      const res = await getCourseQuestionBanksApi(courseId);
      if (res.success && res.data) {
        setBanks(res.data);
      }
    } catch {
      message.error('Failed to load question banks');
    } finally {
      setLoadingBanks(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!open || !courseId) return;
    let isMounted = true;
    getCourseQuestionBanksApi(courseId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setBanks(res.data);
        }
      })
      .catch(() => {
        if (isMounted) message.error('Failed to load question banks');
      })
      .finally(() => {
        if (isMounted) setLoadingBanks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, courseId]);

  // 2. Fetch Bank Details (questions & options)
  const fetchBankDetail = async (bankId: string) => {
    try {
      setLoadingDetail(true);
      const res = await getQuestionBankByIdApi(bankId);
      if (res.success && res.data) {
        setSelectedBank(res.data);
      }
    } catch {
      message.error('Failed to load bank questions');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 3. Bank CRUD Handlers
  const handleOpenCreateBank = () => {
    setBankToEdit(null);
    bankForm.resetFields();
    bankForm.setFieldsValue({ title: '', description: '', is_active: true });
    setBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: QuestionBank, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBankToEdit(bank);
    bankForm.setFieldsValue({
      title: bank.title,
      description: bank.description || '',
      is_active: bank.is_active,
    });
    setBankModalOpen(true);
  };

  const handleSaveBank = async () => {
    try {
      const values = await bankForm.validateFields();
      setSavingBank(true);

      if (bankToEdit) {
        const res = await updateQuestionBankApi(bankToEdit.id, values);
        if (res.success) {
          message.success('Question bank updated successfully');
          setBankModalOpen(false);
          await fetchBanks();
          if (selectedBank?.id === bankToEdit.id) {
            await fetchBankDetail(bankToEdit.id);
          }
        }
      } else {
        const res = await createQuestionBankApi(courseId, values);
        if (res.success) {
          message.success('Question bank created successfully');
          setBankModalOpen(false);
          await fetchBanks();
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Error saving question bank');
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async (bankId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await deleteQuestionBankApi(bankId);
      if (res.success) {
        message.success('Question bank deleted successfully');
        if (selectedBank?.id === bankId) {
          setSelectedBank(null);
        }
        await fetchBanks();
      }
    } catch {
      message.error('Failed to delete question bank');
    }
  };

  // 4. Question CRUD Handlers
  const handleOpenCreateQuestion = () => {
    setQuestionToEdit(null);
    questionForm.resetFields();
    setSelectedQuestionType('single_choice');
    questionForm.setFieldsValue({
      content: '',
      question_type: 'single_choice',
      difficulty: 'easy',
      topic: 'General',
      points: 1,
      options: [
        { content: '', is_correct: true },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
      ],
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: BankQuestion) => {
    setQuestionToEdit(q);
    setSelectedQuestionType(q.question_type);
    questionForm.setFieldsValue({
      content: q.content,
      question_type: q.question_type,
      difficulty: q.difficulty,
      topic: q.topic,
      points: q.points,
      options: q.bank_question_options.map((opt) => ({
        id: opt.id,
        content: opt.content,
        is_correct: opt.is_correct,
      })),
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedBank) return;

    try {
      const values = await questionForm.validateFields();

      // Validate options logic
      const options = values.options || [];
      const correctCount = options.filter(
        (o: { is_correct: boolean }) => o.is_correct
      ).length;

      if (values.question_type === 'single_choice' && correctCount !== 1) {
        message.error('Single choice questions must have exactly 1 correct answer.');
        return;
      }
      if (values.question_type === 'multiple_choice' && correctCount < 1) {
        message.error('Multiple choice questions must have at least 1 correct answer.');
        return;
      }

      setSavingQuestion(true);

      if (questionToEdit) {
        const payload: UpdateBankQuestionRequest = {
          content: values.content,
          question_type: values.question_type,
          difficulty: values.difficulty as QuestionDifficulty,
          topic: values.topic,
          points: values.points,
          options: values.options.map(
            (o: { content: string; is_correct: boolean }, idx: number) => ({
              content: o.content,
              is_correct: o.is_correct ?? false,
              order_index: idx + 1,
            })
          ),
        };

        const res = await updateBankQuestionApi(questionToEdit.id, payload);
        if (res.success) {
          message.success('Question updated successfully');
          setQuestionModalOpen(false);
          await fetchBankDetail(selectedBank.id);
          await fetchBanks();
        }
      } else {
        const payload: CreateBankQuestionRequest = {
          content: values.content,
          question_type: values.question_type,
          difficulty: values.difficulty as QuestionDifficulty,
          topic: values.topic,
          points: values.points,
          options: values.options.map(
            (o: { content: string; is_correct: boolean }, idx: number) => ({
              content: o.content,
              is_correct: o.is_correct ?? false,
              order_index: idx + 1,
            })
          ),
        };

        const res = await createBankQuestionApi(selectedBank.id, payload);
        if (res.success) {
          message.success('Question created successfully');
          setQuestionModalOpen(false);
          await fetchBankDetail(selectedBank.id);
          await fetchBanks();
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Error saving question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedBank) return;
    try {
      const res = await deleteBankQuestionApi(questionId);
      if (res.success) {
        message.success('Question deleted successfully');
        await fetchBankDetail(selectedBank.id);
        await fetchBanks();
      }
    } catch {
      message.error('Failed to delete question');
    }
  };

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DatabaseOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 17 }}>
                Course Question Banks
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {courseTitle}
              </Text>
            </div>
          </div>
        }
        open={open}
        onClose={onClose}
        width={780}
        destroyOnClose
        extra={
          !selectedBank ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateBank}
              style={{
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: token.colorPrimary,
                color: '#262626',
                borderColor: '#262626',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              New Question Bank
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateQuestion}
              style={{
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: token.colorPrimary,
                color: '#262626',
                borderColor: '#262626',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              Add Question
            </Button>
          )
        }
      >
        {/* ========================================================= */}
        {/* VIEW 1: QUESTION BANKS LIST */}
        {/* ========================================================= */}
        {!selectedBank ? (
          <div>
            {loadingBanks ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
              </div>
            ) : banks.length === 0 ? (
              <Empty
                description="No Question Banks created for this course yet."
                style={{ margin: '60px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreateBank}
                  style={{
                    borderRadius: 4,
                    fontWeight: 700,
                    backgroundColor: token.colorPrimary,
                    color: '#262626',
                    borderColor: '#262626',
                  }}
                >
                  Create Your First Bank
                </Button>
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    onClick={() => void fetchBankDetail(bank.id)}
                    style={{
                      backgroundColor: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 8,
                      padding: '20px 24px',
                      boxShadow: '1px 1px 0px 0px #262626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          backgroundColor: '#ecfccb',
                          border: '1px solid #bef264',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FolderOpenOutlined style={{ fontSize: 22, color: '#3f6212' }} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 16, color: token.colorText }}>
                            {bank.title}
                          </Text>
                          <Tag
                            style={{
                              borderRadius: 9999,
                              fontWeight: 700,
                              fontSize: 11,
                              backgroundColor: '#f4f4f5',
                              border: 'none',
                            }}
                          >
                            {bank.questions_count || 0} Questions
                          </Tag>
                        </div>
                        {bank.description && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 1 }}
                            style={{ margin: '4px 0 0 0', fontSize: 13 }}
                          >
                            {bank.description}
                          </Paragraph>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Space size="small" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit Bank Info">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => handleOpenEditBank(bank, e)}
                          style={{ borderRadius: 4 }}
                        />
                      </Tooltip>

                      <Popconfirm
                        title="Delete question bank?"
                        description="All questions in this bank will be permanently removed."
                        onConfirm={(e) => void handleDeleteBank(bank.id, e)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Delete Bank">
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ borderRadius: 4 }}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: BANK DETAILS & QUESTIONS LIST */
          /* ========================================================= */
          <div>
            {/* Header Navigation Back */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: `1px solid ${token.colorBorder}`,
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setSelectedBank(null)}
                style={{ borderRadius: 4, fontWeight: 600 }}
              >
                Back to All Banks
              </Button>

              <Text strong style={{ fontSize: 16 }}>
                {selectedBank.title} ({selectedBank.bank_questions?.length || 0} Questions)
              </Text>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
              </div>
            ) : !selectedBank.bank_questions || selectedBank.bank_questions.length === 0 ? (
              <Empty
                description="This bank has no questions yet."
                style={{ margin: '60px 0' }}
              >
                <Button
                  type="primary"
                  icon={<FileAddOutlined />}
                  onClick={handleOpenCreateQuestion}
                  style={{
                    borderRadius: 4,
                    fontWeight: 700,
                    backgroundColor: token.colorPrimary,
                    color: '#262626',
                    borderColor: '#262626',
                  }}
                >
                  Create First Question
                </Button>
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedBank.bank_questions.map((q, idx) => (
                  <Card
                    key={q.id}
                    size="small"
                    style={{
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 8,
                      backgroundColor: token.colorBgContainer,
                      boxShadow: '1px 1px 0px 0px #262626',
                    }}
                    title={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Space size="small">
                          <Text strong style={{ fontSize: 13 }}>
                            Q{idx + 1}.
                          </Text>
                          <Tag
                            style={{
                              borderRadius: 9999,
                              fontWeight: 700,
                              fontSize: 10,
                              textTransform: 'uppercase',
                              backgroundColor:
                                q.question_type === 'single_choice' ? '#eff6ff' : '#faf5ff',
                              color:
                                q.question_type === 'single_choice' ? '#1d4ed8' : '#7e22ce',
                              border: 'none',
                            }}
                          >
                            {q.question_type === 'single_choice' ? 'Single Choice' : 'Multiple'}
                          </Tag>
                          <Tag
                            color={
                              q.difficulty === 'easy'
                                ? 'success'
                                : q.difficulty === 'hard'
                                  ? 'error'
                                  : 'warning'
                            }
                            style={{ borderRadius: 9999, fontWeight: 700, fontSize: 10 }}
                          >
                            {q.difficulty}
                          </Tag>
                          <Tag style={{ borderRadius: 9999, fontSize: 10 }}>{q.points} pt</Tag>
                        </Space>

                        <Space size="small">
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditQuestion(q)}
                            style={{ borderRadius: 4 }}
                          />
                          <Popconfirm
                            title="Delete this question?"
                            description="Are you sure you want to delete this question?"
                            onConfirm={() => void handleDeleteQuestion(q.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ borderRadius: 4 }}
                            />
                          </Popconfirm>
                        </Space>
                      </div>
                    }
                  >
                    <Paragraph style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
                      {q.content}
                    </Paragraph>

                    {/* Options summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.bank_question_options.map((opt) => (
                        <div
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 12px',
                            borderRadius: 4,
                            backgroundColor: opt.is_correct ? '#f0fdf4' : token.colorBgLayout,
                            border: `1px solid ${opt.is_correct ? '#bbf7d0' : token.colorBorderSecondary}`,
                          }}
                        >
                          <Text style={{ fontSize: 13, color: token.colorText }}>
                            {opt.content}
                          </Text>
                          {opt.is_correct && (
                            <Tag
                              icon={<CheckCircleOutlined />}
                              color="success"
                              style={{ borderRadius: 4, fontSize: 11 }}
                            >
                              Correct
                            </Tag>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT QUESTION BANK */}
      {/* ========================================================= */}
      <Modal
        title={bankToEdit ? 'Edit Question Bank' : 'Create New Question Bank'}
        open={bankModalOpen}
        onCancel={() => setBankModalOpen(false)}
        onOk={() => void handleSaveBank()}
        confirmLoading={savingBank}
        okText="Save Bank"
        okButtonProps={{
          style: {
            backgroundColor: token.colorPrimary,
            color: '#262626',
            borderColor: '#262626',
            fontWeight: 700,
          },
        }}
        destroyOnClose
      >
        <Form form={bankForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label={<Text strong>Bank Title</Text>}
            rules={[{ required: true, message: 'Please enter question bank title' }]}
          >
            <Input placeholder="e.g. JavaScript Async & Promises Pool" style={{ borderRadius: 4 }} />
          </Form.Item>

          <Form.Item name="description" label={<Text strong>Description</Text>}>
            <Input.TextArea
              rows={3}
              placeholder="Topic focus, level overview..."
              style={{ borderRadius: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: CREATE / EDIT QUESTION & OPTIONS */}
      {/* ========================================================= */}
      <Modal
        title={questionToEdit ? 'Edit Bank Question' : 'Add New Question'}
        open={questionModalOpen}
        onCancel={() => setQuestionModalOpen(false)}
        onOk={() => void handleSaveQuestion()}
        confirmLoading={savingQuestion}
        width={720}
        okText="Save Question"
        okButtonProps={{
          style: {
            backgroundColor: token.colorPrimary,
            color: '#262626',
            borderColor: '#262626',
            fontWeight: 700,
          },
        }}
        destroyOnClose
      >
        <Form form={questionForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="content"
            label={<Text strong>Question Content</Text>}
            rules={[{ required: true, message: 'Please enter question text' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter the full question prompt..."
              style={{ borderRadius: 4 }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Form.Item
              name="question_type"
              label={<Text strong>Question Type</Text>}
              rules={[{ required: true }]}
            >
              <Select
                onChange={(val: QuestionType) => setSelectedQuestionType(val)}
                style={{ borderRadius: 4 }}
              >
                <Option value="single_choice">Single Choice</Option>
                <Option value="multiple_choice">Multiple Choice</Option>
              </Select>
            </Form.Item>

            <Form.Item name="difficulty" label={<Text strong>Difficulty</Text>}>
              <Select style={{ borderRadius: 4 }}>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>

            <Form.Item name="points" label={<Text strong>Points</Text>}>
              <InputNumber min={1} max={100} style={{ width: '100%', borderRadius: 4 }} />
            </Form.Item>

            <Form.Item name="topic" label={<Text strong>Topic Tag</Text>}>
              <Input placeholder="General" style={{ borderRadius: 4 }} />
            </Form.Item>
          </div>

          <Title level={5} style={{ marginTop: 12, marginBottom: 8, fontSize: 14 }}>
            Choice Options ({selectedQuestionType === 'single_choice' ? 'Pick 1 correct answer' : 'Select all correct answers'})
          </Title>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map(({ key, name, ...restField }, idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      backgroundColor: token.colorBgLayout,
                      borderRadius: 6,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    {/* Radio or Checkbox for correct answer */}
                    <Form.Item
                      {...restField}
                      name={[name, 'is_correct']}
                      valuePropName="checked"
                      noStyle
                    >
                      {selectedQuestionType === 'single_choice' ? (
                        <Radio
                          checked={questionForm.getFieldValue(['options', name, 'is_correct'])}
                          onChange={() => {
                            // Uncheck all other options
                            const currentOpts = questionForm.getFieldValue('options') || [];
                            const updated = currentOpts.map(
                              (opt: { content: string; is_correct: boolean }, i: number) => ({
                                ...opt,
                                is_correct: i === name,
                              })
                            );
                            questionForm.setFieldsValue({ options: updated });
                          }}
                        />
                      ) : (
                        <Checkbox />
                      )}
                    </Form.Item>

                    <Text strong style={{ fontSize: 13, width: 24 }}>
                      {String.fromCharCode(65 + idx)}.
                    </Text>

                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      rules={[{ required: true, message: 'Option content required' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder={`Option ${idx + 1} content...`} style={{ borderRadius: 4 }} />
                    </Form.Item>

                    {fields.length > 2 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        size="small"
                      />
                    )}
                  </div>
                ))}

                {fields.length < 8 && (
                  <Button
                    type="dashed"
                    onClick={() => add({ content: '', is_correct: false })}
                    icon={<PlusOutlined />}
                    style={{ borderRadius: 4 }}
                  >
                    Add Option Choice
                  </Button>
                )}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
};
