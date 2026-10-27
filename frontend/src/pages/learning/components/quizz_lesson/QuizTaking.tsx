import React from 'react';
import {
  Typography,
  Button,
  Tag,
  Radio,
  Checkbox,
  Space,
  Popconfirm,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { QuizTakingProps } from './types';
import { QuizTimer } from './QuizTimer';
import { QuizQuestionGrid } from './QuizQuestionGrid';

const { Title, Text } = Typography;

export const QuizTaking: React.FC<QuizTakingProps> = ({
  activeAttempt,
  currentQuestionIndex,
  selectedAnswers,
  remainingSeconds,
  submitting,
  answeredCount,
  formatTime,
  onSelectOption,
  onQuestionIndexChange,
  onSubmitQuiz,
}) => {
  const { token } = theme.useToken();

  const questions = activeAttempt.questions;
  const currentQ = questions[currentQuestionIndex];
  const isSingle = currentQ.question_type === 'single_choice';
  const currentSelected = selectedAnswers[currentQ.id] || [];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sticky Header Bar: Timer & Quick Progress */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 8,
          padding: '16px 24px',
          boxShadow: 'var(--shadow-hard)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Left: Progress info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Text strong style={{ fontSize: 16 }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Tag
            style={{
              borderRadius: 9999,
              fontWeight: 700,
              backgroundColor: answeredCount === questions.length ? '#dcfff1' : '#f4f4f5',
              color: answeredCount === questions.length ? '#065f46' : '#525252',
              border: 'none',
            }}
          >
            {answeredCount}/{questions.length} Answered
          </Tag>
        </div>

        {/* Right: Countdown Timer */}
        <QuizTimer remainingSeconds={remainingSeconds} formatTime={formatTime} />
      </div>

      {/* Main Question Workspace */}
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 8,
          padding: '32px 36px',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        {/* Question Meta Badge */}
        <Space size="small" style={{ marginBottom: 12 }}>
          <Tag
            style={{
              borderRadius: 9999,
              fontWeight: 700,
              backgroundColor: isSingle ? '#eff6ff' : '#faf5ff',
              color: isSingle ? '#1d4ed8' : '#7e22ce',
              border: `1px solid ${isSingle ? '#bfdbfe' : '#e9d5ff'}`,
            }}
          >
            {isSingle ? 'Single Choice' : 'Multiple Choice (Select all that apply)'}
          </Tag>
          <Tag style={{ borderRadius: 9999, fontWeight: 700 }}>
            {currentQ.points} {currentQ.points > 1 ? 'Points' : 'Point'}
          </Tag>
        </Space>

        {/* Question Text */}
        <Title
          level={3}
          style={{
            margin: '0 0 28px 0',
            fontSize: 20,
            lineHeight: 1.5,
            color: token.colorText,
          }}
        >
          {currentQ.content}
        </Title>

        {/* Options Choice List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentQ.options.map((opt) => {
            const isChecked = currentSelected.includes(opt.id);

            return (
              <div
                key={opt.id}
                onClick={() => onSelectOption(currentQ.id, opt.id, isSingle)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 6,
                  border: `1.5px solid ${isChecked ? '#262626' : token.colorBorder}`,
                  backgroundColor: isChecked ? '#f7fee7' : token.colorBgContainer,
                  boxShadow: isChecked ? 'var(--shadow-hard)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSingle ? (
                  <Radio checked={isChecked} style={{ pointerEvents: 'none' }} />
                ) : (
                  <Checkbox checked={isChecked} style={{ pointerEvents: 'none' }} />
                )}
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: isChecked ? 600 : 400,
                    color: token.colorText,
                    userSelect: 'none',
                  }}
                >
                  {opt.content}
                </Text>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 36,
            paddingTop: 24,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            disabled={currentQuestionIndex === 0}
            icon={<ArrowLeftOutlined />}
            onClick={() => onQuestionIndexChange((prev) => prev - 1)}
            style={{ borderRadius: 4, fontWeight: 600 }}
          >
            Previous
          </Button>

          <Space size="middle">
            {!isLastQuestion ? (
              <Button
                type="default"
                onClick={() => onQuestionIndexChange((prev) => prev + 1)}
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                Next <ArrowRightOutlined />
              </Button>
            ) : null}

            {/* Submit Quiz with Confirmation */}
            <Popconfirm
              title="Submit Quiz Assessment"
              description={
                answeredCount < questions.length
                  ? `You have answered ${answeredCount}/${questions.length} questions. Submit now?`
                  : 'Are you sure you want to finalize and submit your assessment?'
              }
              onConfirm={() => void onSubmitQuiz()}
              okText="Yes, Submit"
              cancelText="Keep Reviewing"
              okButtonProps={{
                style: {
                  backgroundColor: token.colorPrimary,
                  color: '#262626',
                  fontWeight: 700,
                  borderColor: '#262626',
                },
              }}
            >
              <Button
                type="primary"
                loading={submitting}
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: token.colorPrimary,
                  color: '#262626',
                  borderColor: '#262626',
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                Submit Assessment
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>

      {/* Quick Question Navigation Palette */}
      <QuizQuestionGrid
        totalQuestions={questions.length}
        questionIds={questions.map((q) => q.id)}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswers={selectedAnswers}
        onSelectQuestion={(idx) => onQuestionIndexChange(idx)}
      />
    </div>
  );
};
