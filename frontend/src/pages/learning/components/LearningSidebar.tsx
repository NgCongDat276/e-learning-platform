import React from "react";
import { Typography, Collapse, Tag, theme } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import type {
  ClassroomLesson,
  ClassroomChapter,
} from "../../../types/enrollment.types";

const { Title, Text } = Typography;

interface LearningSidebarProps {
  chapters: ClassroomChapter[];
  activeLessonId?: string;
  totalLessons: number;
  collapsed: boolean;
  onSelectLesson: (lesson: ClassroomLesson) => void;
  formatDuration: (seconds?: number | null) => string;
}

export const LearningSidebar: React.FC<LearningSidebarProps> = ({
  chapters,
  activeLessonId,
  totalLessons,
  collapsed,
  onSelectLesson,
  formatDuration,
}) => {
  const { token } = theme.useToken();

  if (collapsed) return null;

  return (
    <aside
      style={{
        width: "23%",
        minWidth: 360,
        flexShrink: 0,
        backgroundColor: token.colorBgContainer, // #ffffff
        borderLeft: `1px solid ${token.colorBorder}`, // #e5e5e5
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-1px 0 3px 0 rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "20px 20px 16px 20px",
          borderBottom: `1px solid ${token.colorBorder}`,
          backgroundColor: "#fafafa",
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, fontSize: 16, letterSpacing: -0.3 }}
        >
          Course Content
        </Title>
        <Text
          type="secondary"
          style={{ fontSize: 12, marginTop: 4, display: "block" }}
        >
          {chapters.length} chapters · {totalLessons} lessons
        </Text>
      </div>

      {/* Chapters & Lessons Tree Accordion */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <Collapse
          defaultActiveKey={chapters.map((ch) => ch.id)}
          ghost
          expandIconPosition="end"
          items={chapters.map((chapter, chIdx) => {
            const chapterCompletedCount = chapter.lessons.filter(
              (l) => l.is_completed,
            ).length;

            return {
              key: chapter.id,
              label: (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Text strong style={{ color: token.colorText, fontSize: 14 }}>
                    Chapter {chIdx + 1}: {chapter.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {chapterCompletedCount}/{chapter.lessons.length} completed
                  </Text>
                </div>
              ),
              children: (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {chapter.lessons.map((lesson, lIdx) => {
                    const isActive = activeLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          backgroundColor: isActive ? "#f0fdf4" : "transparent",
                          borderLeft: isActive
                            ? "3px solid #a3e635"
                            : "3px solid transparent",
                          border: isActive
                            ? "1px solid #bbf7d0"
                            : "1px solid transparent",
                          borderLeftWidth: isActive ? 3 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                          }}
                        >
                          {/* Completion Checkmark */}
                          {lesson.is_completed ? (
                            <CheckCircleFilled
                              style={{
                                color: "#059669",
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 9999,
                                border: `1.5px solid ${token.colorBorder}`,
                                flexShrink: 0,
                                backgroundColor: token.colorBgContainer,
                              }}
                            />
                          )}

                          {/* Lesson Title */}
                          <div style={{ minWidth: 0 }}>
                            <Text
                              style={{
                                color: isActive
                                  ? token.colorText
                                  : lesson.is_completed
                                    ? token.colorTextSecondary
                                    : token.colorText,
                                fontSize: 13,
                                fontWeight: isActive ? 700 : 400,
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {chIdx + 1}.{lIdx + 1} {lesson.title}
                            </Text>
                          </div>
                        </div>

                        {/* Duration or Type Badge */}
                        <div style={{ flexShrink: 0, marginLeft: 8 }}>
                          {lesson.lesson_type === "video" ? (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatDuration(lesson.duration_seconds)}
                            </Text>
                          ) : lesson.lesson_type === "quiz" ? (
                            <Tag
                              style={{
                                fontSize: 10,
                                borderRadius: 4,
                                margin: 0,
                                backgroundColor: "#fef3c7",
                                borderColor: "#fde68a",
                                color: "#b45309",
                                fontWeight: 600,
                              }}
                            >
                              Quiz
                            </Tag>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Read
                            </Text>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ),
            };
          })}
        />
      </div>
    </aside>
  );
};
