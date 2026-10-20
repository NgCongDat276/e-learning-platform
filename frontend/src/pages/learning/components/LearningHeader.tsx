import React from "react";
import { Typography, Button, Progress, Tooltip, Divider, theme } from "antd";
import {
  HomeOutlined,
  // ArrowLeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Text } = Typography;

interface LearningHeaderProps {
  courseTitle: string;
  lessonTitle: string;
  courseSlug: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const LearningHeader: React.FC<LearningHeaderProps> = ({
  courseTitle,
  lessonTitle,
  // courseSlug,
  progressPercent,
  completedLessons,
  totalLessons,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const { token } = theme.useToken();

  return (
    <header
      style={{
        height: 64,
        backgroundColor: token.colorPrimaryBg, // #ffffff
        borderBottom: `1px solid ${token.colorBorder}`, // #e5e5e5
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Left: Back button & Course / Lesson Title */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}
      >
        <Tooltip title="Back to dashboard">
          <Link to={`/`}>
            <Button
              type="default"
              icon={
                <HomeOutlined
                  style={{ color: token.colorText, fontSize: 15 }}
                />
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: token.colorBgContainer,
                borderColor: token.colorBorder,
                borderRadius: 4,
                height: 38,
                width: 38,
                boxShadow: "1px 1px 0px 0px #262626",
              }}
            />
          </Link>
        </Tooltip>

        <Divider
          type="vertical"
          style={{ borderColor: token.colorBorder, height: 26 }}
        />

        <div style={{ minWidth: 0 }}>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              fontWeight: 500,
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {courseTitle}
          </Text>
          <Text
            strong
            style={{
              color: token.colorText,
              fontSize: 15,
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: -0.2,
            }}
          >
            {lessonTitle}
          </Text>
        </div>
      </div>

      {/* Right: Progress Tracker & Sidebar Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Progress Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Text
              style={{ color: token.colorText, fontSize: 13, fontWeight: 700 }}
            >
              {completedLessons}/{totalLessons} Lessons ({progressPercent}%)
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {progressPercent === 100 ? "Completed" : "In Progress"}
            </Text>
          </div>

          <Progress
            percent={progressPercent}
            size="small"
            strokeColor="#059669"
            trailColor="#e5e5e5"
            style={{ width: 100, margin: 0 }}
            showInfo={false}
          />

          {progressPercent === 100 && (
            <Tooltip title="Congratulations! You have completed all lessons.">
              <TrophyOutlined style={{ color: "#059669", fontSize: 18 }} />
            </Tooltip>
          )}
        </div>

        <Divider
          type="vertical"
          style={{ borderColor: token.colorBorder, height: 26 }}
        />

        {/* Sidebar Toggle Button */}
        <Tooltip
          title={
            sidebarCollapsed ? "Expand Curriculum Sidebar" : "Collapse Sidebar"
          }
        >
          <Button
            type="default"
            icon={
              sidebarCollapsed ? (
                <MenuUnfoldOutlined
                  style={{ color: token.colorText, fontSize: 15 }}
                />
              ) : (
                <MenuFoldOutlined
                  style={{ color: token.colorText, fontSize: 15 }}
                />
              )
            }
            onClick={onToggleSidebar}
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              borderRadius: 4,
              height: 38,
              width: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "1px 1px 0px 0px #262626",
            }}
          />
        </Tooltip>
      </div>
    </header>
  );
};
