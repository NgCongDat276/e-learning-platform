import React from "react";
import { Typography, Space, Button, Tag, theme } from "antd";
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import type {
  ClassroomLesson,
  ClassroomChapter,
} from "../../../types/enrollment.types";

const { Title, Text, Paragraph } = Typography;

interface LessonContentProps {
  lesson: ClassroomLesson;
  chapter: ClassroomChapter | null;
  togglingCompletion: boolean;
  onToggleComplete: () => void;
  formatDuration: (seconds?: number | null) => string;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  chapter,
  togglingCompletion,
  onToggleComplete,
  formatDuration,
}) => {
  const { token } = theme.useToken();

  return (
    <div style={{ marginTop: 0 }}>
      {/* 1. Header Bar: Meta Info & Mark as Complete Button */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 20,
          borderBottom: `1px solid ${token.colorBorder}`,
          marginBottom: 24,
        }}
      >
        <div>
          <Space size="middle" wrap style={{ marginBottom: 8 }}>
            <Tag
              style={{
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                backgroundColor:
                  lesson.lesson_type === "video"
                    ? "#eff6ff"
                    : lesson.lesson_type === "quiz"
                      ? "#fef3c7"
                      : "#f0fdf4",
                color:
                  lesson.lesson_type === "video"
                    ? "#1d4ed8"
                    : lesson.lesson_type === "quiz"
                      ? "#b45309"
                      : "#15803d",
                border: `1px solid ${
                  lesson.lesson_type === "video"
                    ? "#bfdbfe"
                    : lesson.lesson_type === "quiz"
                      ? "#fde68a"
                      : "#bbf7d0"
                }`,
              }}
            >
              {lesson.lesson_type} Lesson
            </Tag>

            {chapter && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Chapter:{" "}
                <Text strong style={{ color: token.colorText }}>
                  {chapter.title}
                </Text>
              </Text>
            )}

            {lesson.duration_seconds ? (
              <Space size={4}>
                <ClockCircleOutlined
                  style={{ color: token.colorTextSecondary, fontSize: 12 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDuration(lesson.duration_seconds)}
                </Text>
              </Space>
            ) : null}
          </Space>

          <Title
            level={2}
            style={{ margin: 0, fontSize: 26, letterSpacing: -0.5 }}
          >
            {lesson.title}
          </Title>
        </div>

        {/* Mark as completed toggle button */}
        <Button
          size="middle"
          loading={togglingCompletion}
          icon={
            lesson.is_completed ? (
              <CheckCircleFilled style={{ color: "#059669" }} />
            ) : (
              <CheckCircleOutlined />
            )
          }
          onClick={onToggleComplete}
          style={{
            borderRadius: 4,
            fontWeight: 600,
            backgroundColor: lesson.is_completed
              ? "#dcfff1"
              : token.colorBgContainer,
            borderColor: lesson.is_completed ? "#7ee2b8" : token.colorBorder,
            color: lesson.is_completed ? "#065f46" : token.colorText,
            boxShadow: "1px 1px 0px 0px #262626",
          }}
        >
          {lesson.is_completed ? "Completed" : "Mark As Completed"}
        </Button>
      </div>

      {/* 2. Reading Article / Text Notes Content */}
      {lesson.lesson_content && (
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            padding: "28px 32px",
            borderRadius: 8,
            border: `1px solid ${token.colorBorder}`,
            boxShadow: "1px 1px 0px 0px #262626",
            marginBottom: 24,
          }}
        >
          <Title
            level={4}
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 18,
              letterSpacing: -0.3,
            }}
          >
            Lesson Walkthrough & Lecture Notes
          </Title>
          <Paragraph
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: token.colorText,
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {lesson.lesson_content}
          </Paragraph>
        </div>
      )}

      {/* 3. Downloadable PDF / R2 Attachment */}
      {lesson.lesson_type === "text" && lesson.content_url && (
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "1px 1px 0px 0px #262626",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                backgroundColor: "#dcfff1",
                border: "1px solid #7ee2b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileTextOutlined style={{ fontSize: 22, color: "#065f46" }} />
            </div>
            <div>
              <Text
                strong
                style={{
                  fontSize: 15,
                  display: "block",
                  color: token.colorText,
                }}
              >
                Lesson Document & Slides (PDF)
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hosted on Cloudflare R2 High-speed Edge Storage
              </Text>
            </div>
          </div>

          <a
            href={lesson.content_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              type="primary"
              // icon={<DownloadOutlined />}
              style={{
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: token.colorPrimary, // #a3e635
                color: token.colorText, // #262626
                border: `1px solid ${token.colorText}`,
                boxShadow: "var(--shadow-hard)",
              }}
            >
              Open PDF Document
            </Button>
          </a>
        </div>
      )}

      {/* 4. Quiz Notice Card */}
      {lesson.lesson_type === "quiz" && (
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: "36px 32px",
            textAlign: "center",
            boxShadow: "1px 1px 0px 0px #262626",
            marginBottom: 24,
          }}
        >
          <QuestionCircleOutlined
            style={{
              fontSize: 44,
              color: token.colorPrimary,
              marginBottom: 14,
            }}
          />
          <Title level={3} style={{ margin: "0 0 10px 0", fontSize: 22 }}>
            Interactive Diagnostic Check
          </Title>
          <Paragraph
            type="secondary"
            style={{
              maxWidth: 580,
              margin: "0 auto",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            This quiz lesson reinforces concepts covered in this chapter. The
            automated assessment engine and timer will be activated under{" "}
            <strong>Module 6 (Question Bank & Quizzes)</strong>.
          </Paragraph>
        </div>
      )}
    </div>
  );
};
