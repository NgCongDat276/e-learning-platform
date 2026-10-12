import React, { useState } from 'react';
import { Card, Typography, Tag, Progress, Button, Row, Col, Space, theme } from 'antd';
import {
  ThunderboltFilled,
  CodeOutlined,
  CheckCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import { QUIZ_DEMO_DATA } from '../data/home.data';

const { Title, Paragraph, Text } = Typography;

export const InteractiveDemoSection: React.FC = () => {
  const { token } = theme.useToken();

  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  return (
    <section id="interactive-demo" style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 36 }}>
        <Tag
          style={{
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 11,
            textTransform: 'uppercase',
            backgroundColor: token.colorBgLayout,
            borderColor: token.colorBorder,
            marginBottom: 8,
          }}
        >
          Live Interactive Simulator
        </Tag>
        <Title level={2} style={{ margin: 0, fontSize: 32, letterSpacing: -0.8 }}>
          Experience the Student Interface
        </Title>
        <Text type="secondary" style={{ fontSize: 15, marginTop: 4, display: 'block' }}>
          Try an interactive assessment right now and inspect our momentum tracker.
        </Text>
      </div>

      <Row gutter={[28, 28]}>
        {/* Left Widget: Student Streak & Momentum Hub */}
        <Col xs={24} lg={10}>
          <Card
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
              boxShadow: 'var(--shadow-hard)',
              height: '100%',
            }}
            styles={{ body: { padding: '28px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Space size={10} align="center">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: token.borderRadius,
                    backgroundColor: token.colorText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThunderboltFilled style={{ fontSize: 22, color: token.colorPrimary }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>
                    Learning Habit Streak
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Consistency over cramming
                  </Text>
                </div>
              </Space>
              <Tag color="success" style={{ borderRadius: 9999, fontWeight: 600 }}>
                Active
              </Tag>
            </div>

            <Title level={1} style={{ fontSize: 44, margin: '8px 0 4px', letterSpacing: -1 }}>
              12{' '}
              <span style={{ fontSize: 18, fontWeight: 500, color: token.colorTextSecondary }}>
                days in a row
              </span>
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 24 }}>
              You are in the top 5% of active engineering learners this week. Complete today's module to maintain streak.
            </Paragraph>

            {/* 7 Days tracker dots */}
            <div
              style={{
                padding: '16px 18px',
                backgroundColor: token.colorBgLayout,
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorder}`,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13 }}>
                  Weekly Target: 6 / 7 Lessons
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  85% on track
                </Text>
              </div>
              <Progress percent={85} strokeColor={token.colorPrimary} size="small" showInfo={false} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: idx < 6 ? token.colorPrimary : '#e5e5e5',
                        color: idx < 6 ? '#262626' : '#a3a3a3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        margin: '0 auto 4px',
                        border: `1px solid ${token.colorText}`,
                      }}
                    >
                      {idx < 6 ? '✓' : '·'}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {day}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookmark card */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#ffffff',
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Text strong style={{ fontSize: 13, display: 'block' }}>
                  Next Up: Chapter 4 · Database Indexing
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Estimated time: 18 minutes
                </Text>
              </div>
              <Button size="small" type="primary" style={{ fontWeight: 600 }}>
                Resume
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right Widget: Live Interactive Diagnostic Quiz Simulator */}
        <Col xs={24} lg={14}>
          <Card
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadiusLG,
              boxShadow: 'var(--shadow-hard)',
              height: '100%',
            }}
            styles={{ body: { padding: '28px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space size={8}>
                <CodeOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Module Diagnostic Check · Chapter 3
                </Text>
              </Space>
              <Tag style={{ borderRadius: 9999, fontWeight: 600 }}>1 Question Interactive Demo</Tag>
            </div>

            <Title level={4} style={{ fontSize: 17, lineHeight: 1.45, marginBottom: 20 }}>
              {QUIZ_DEMO_DATA.prompt}
            </Title>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {QUIZ_DEMO_DATA.options.map((option) => {
                const isSelected = selectedQuizOption === option.id;
                let borderColor = token.colorBorder;
                let bg = token.colorBgLayout;

                if (quizSubmitted) {
                  if (option.isCorrect) {
                    borderColor = token.colorSuccess;
                    bg = '#dcfff1';
                  } else if (isSelected && !option.isCorrect) {
                    borderColor = token.colorError;
                    bg = '#fee2e2';
                  }
                } else if (isSelected) {
                  borderColor = token.colorText;
                  bg = '#f5f5f5';
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (!quizSubmitted) setSelectedQuizOption(option.id);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: token.borderRadius,
                      border: `1px solid ${borderColor}`,
                      backgroundColor: bg,
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400 }}>
                      {option.text}
                    </Text>
                    {quizSubmitted && option.isCorrect && (
                      <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 16 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons & Explanation Banner */}
            {!quizSubmitted ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  disabled={selectedQuizOption === null}
                  onClick={() => setQuizSubmitted(true)}
                  style={{
                    fontWeight: 600,
                    boxShadow: selectedQuizOption !== null ? 'var(--shadow-hard)' : 'none',
                  }}
                >
                  Submit Answer
                </Button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: selectedQuizOption === 0 ? '#f0fdf4' : '#fff1f2',
                    borderRadius: token.borderRadius,
                    border: `1px solid ${selectedQuizOption === 0 ? '#bbf7d0' : '#fecdd3'}`,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    strong
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      color: selectedQuizOption === 0 ? '#166534' : '#991b1b',
                    }}
                  >
                    {selectedQuizOption === 0 ? '✓ Excellent Analysis' : '✕ Re-evaluate Concept'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    {QUIZ_DEMO_DATA.explanation}
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setSelectedQuizOption(null);
                      setQuizSubmitted(false);
                    }}
                  >
                    Reset Assessment
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </section>
  );
};
