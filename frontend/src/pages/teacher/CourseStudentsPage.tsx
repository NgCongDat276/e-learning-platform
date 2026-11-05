import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Input,
  Segmented,
  Progress,
  Row,
  Col,
  Card,
  Empty,
  Breadcrumb,
  Skeleton,
  App,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CommentOutlined,
  EyeOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { getCourseStudentsApi } from "../../api/enrollment.api";
import type {
  CourseStudentItem,
  CourseStudentsResult,
  LessonAnalyticsItem,
} from "../../types/enrollment.types";
import { QuizAnalyticsDrawer } from "./components/QuizAnalyticsDrawer";
import { StudentProgressDrawer } from "./components/StudentProgressDrawer";

const { Title, Text, Paragraph } = Typography;

type ActiveTabKey = "analytics" | "students";
type LessonTypeFilter = "all" | "video" | "text" | "quiz";

const formatDurationMin = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return "Self-paced";
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
};

const formatRelativeActivity = (iso?: string | null): string => {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const CourseStudentsPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<CourseStudentsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Main View Tab: 'analytics' (Tab 1) | 'students' (Tab 2)
  const [activeTab, setActiveTab] = useState<ActiveTabKey>("analytics");

  // Tab 1 State: Lesson Type Filter & Quiz Analytics Drawer
  const [lessonTypeFilter, setLessonTypeFilter] =
    useState<LessonTypeFilter>("all");
  const [selectedQuizLesson, setSelectedQuizLesson] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Tab 2 State: Student Search, Filter & Student Detail Drawer
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_progress" | "completed"
  >("all");
  const [selectedStudent, setSelectedStudent] =
    useState<CourseStudentItem | null>(null);

  // Fetch course analytics & students roster
  const fetchCourseAnalytics = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await getCourseStudentsApi(courseId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        message.error(
          err.response?.data?.message ||
            "Failed to load course analytics and students",
        );
      } else {
        message.error("An unexpected error occurred while loading data");
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, message]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await Promise.resolve();
      if (!ignore) {
        await fetchCourseAnalytics();
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [fetchCourseAnalytics]);

  const students = useMemo(() => data?.students || [], [data]);
  const chapters = useMemo(() => data?.chapters || [], [data]);
  const course = data?.course;
  const overview = data?.overview;

  // Metrics fallback computation
  const metrics = useMemo(() => {
    const total = overview?.totalStudents ?? students.length;
    const completed =
      overview?.completedStudents ??
      students.filter((s) => s.progressPercent === 100).length;
    const inProgress =
      overview?.inProgressStudents ??
      students.filter((s) => s.progressPercent < 100 && s.completedLessons > 0)
        .length;
    const notStarted =
      overview?.notStartedStudents ??
      students.filter((s) => s.completedLessons === 0).length;
    const avgProgress =
      overview?.avgCourseProgress ??
      (total > 0
        ? Math.round(
            students.reduce((acc, s) => acc + s.progressPercent, 0) / total,
          )
        : 0);

    return {
      total,
      completed,
      inProgress,
      notStarted,
      avgProgress,
      totalChapters: overview?.totalChapters ?? chapters.length,
      totalLessons: overview?.totalLessons ?? 0,
      totalQuizzes: overview?.totalQuizzes ?? 0,
      avgQuizScore: overview?.avgQuizScore ?? null,
      quizPassRate: overview?.quizPassRate ?? null,
      totalQuizAttempts: overview?.totalQuizAttempts ?? 0,
      totalComments: overview?.totalComments ?? 0,
    };
  }, [overview, students, chapters]);

  // Count lessons by type for Tab 1 filter
  const lessonTypeCounts = useMemo(() => {
    let all = 0;
    let video = 0;
    let text = 0;
    let quiz = 0;
    for (const ch of chapters) {
      for (const l of ch.lessons) {
        all++;
        if (l.lesson_type === "video") video++;
        else if (l.lesson_type === "text") text++;
        else if (l.lesson_type === "quiz") quiz++;
      }
    }
    return { all, video, text, quiz };
  }, [chapters]);

  // Filtered chapters for Tab 1
  const filteredChapters = useMemo(() => {
    if (lessonTypeFilter === "all") return chapters;
    return chapters
      .map((ch) => ({
        ...ch,
        lessons: ch.lessons.filter((l) => l.lesson_type === lessonTypeFilter),
      }))
      .filter((ch) => ch.lessons.length > 0);
  }, [chapters, lessonTypeFilter]);

  // Filtered students list for Tab 2
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (statusFilter === "completed") {
      result = result.filter((s) => s.progressPercent === 100);
    } else if (statusFilter === "in_progress") {
      result = result.filter((s) => s.progressPercent < 100);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.student.full_name.toLowerCase().includes(q) ||
          s.student.email.toLowerCase().includes(q),
      );
    }

    return result;
  }, [students, statusFilter, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0 || !course) {
      message.warning("No student records to export");
      return;
    }

    const headers = [
      "Student ID",
      "Full Name",
      "Email",
      "Enrolled Date",
      "Completed Lessons",
      "Total Lessons",
      "Progress (%)",
      "Avg Quiz Score (%)",
      "Passed Quizzes",
      "Status",
    ];
    const rows = students.map((s) => [
      `"${s.student.id}"`,
      `"${s.student.full_name}"`,
      `"${s.student.email}"`,
      `"${new Date(s.enrolledAt).toLocaleDateString("en-US")}"`,
      s.completedLessons,
      s.totalLessons,
      `${s.progressPercent}%`,
      s.avgQuizScore !== null && s.avgQuizScore !== undefined
        ? `${s.avgQuizScore}%`
        : "N/A",
      `${s.passedQuizzesCount ?? 0}/${s.totalQuizzesCount ?? 0}`,
      s.progressPercent === 100
        ? "Completed"
        : s.completedLessons > 0
          ? "In Progress"
          : "Not Started",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${course.slug}-analytics-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Course report exported as CSV successfully");
  };

  // ==========================================
  // COLUMNS FOR TAB 1: LESSON & QUIZ ANALYTICS
  // ==========================================
  const lessonColumns: ColumnsType<LessonAnalyticsItem> = [
    {
      title: "Lesson",
      key: "lesson",
      width: 310,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: token.colorText }}>
            {record.title}
          </Text>
          <div style={{ marginTop: 2 }}>
            {record.lesson_type === "quiz" ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Passing score: {record.quizMetrics?.passingScore ?? 60}% • Max
                attempts: {record.quizMetrics?.maxAttempts ?? 1}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Duration: {formatDurationMin(record.duration_seconds)}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "lesson_type",
      key: "lesson_type",
      width: 115,
      render: (type: string) => {
        if (type === "video") {
          return (
            <Tag
              icon={<PlayCircleOutlined />}
              style={{
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                borderColor: "#bfdbfe",
              }}
            >
              Video
            </Tag>
          );
        }
        if (type === "quiz") {
          return (
            <Tag
              icon={<QuestionCircleOutlined />}
              style={{
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                backgroundColor: "#fef3c7",
                color: "#b45309",
                borderColor: "#fde68a",
              }}
            >
              Quiz
            </Tag>
          );
        }
        return (
          <Tag
            icon={<FileTextOutlined />}
            style={{
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 11,
              textTransform: "uppercase",
              backgroundColor: "#f0fdf4",
              color: "#15803d",
              borderColor: "#bbf7d0",
            }}
          >
            Text
          </Tag>
        );
      },
    },
    {
      title: "Student Views / Participation",
      key: "views",
      width: 210,
      sorter: (a, b) => a.viewedStudentsCount - b.viewedStudentsCount,
      render: (_, record) => (
        <div>
          <Space size={6}>
            <EyeOutlined style={{ color: token.colorTextSecondary }} />
            <Text strong style={{ fontSize: 13.5 }}>
              {record.viewedStudentsCount} / {metrics.total}
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              learners
            </Text>
          </Space>
          <div style={{ marginTop: 2 }}>
            {record.lesson_type === "quiz" ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.quizMetrics?.totalAttempts ?? 0} total submissions
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.completedStudentsCount} marked completed
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Completion Rate",
      key: "completionRate",
      width: 200,
      sorter: (a, b) => a.completionRate - b.completionRate,
      render: (_, record) => (
        <div style={{ maxWidth: 170 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.completedStudentsCount}/{metrics.total} finished
            </Text>
            <Text strong style={{ fontSize: 12 }}>
              {record.completionRate}%
            </Text>
          </div>
          <Progress
            percent={record.completionRate}
            showInfo={false}
            size="small"
            strokeColor={
              record.completionRate >= 70
                ? "#059669"
                : record.completionRate >= 40
                  ? token.colorPrimary
                  : "#f59e0b"
            }
          />
        </div>
      ),
    },
    {
      title: "Detailed Metrics & Quiz Insights",
      key: "details",
      render: (_, record) => {
        if (record.lesson_type === "quiz") {
          const qm = record.quizMetrics;
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Space size={8} wrap>
                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 9999,
                    fontWeight: 700,
                    backgroundColor: "#fef9c3",
                    borderColor: "#fde047",
                    color: token.colorText,
                  }}
                >
                  Avg Score:{" "}
                  {qm?.avgScore !== null && qm?.avgScore !== undefined
                    ? `${qm.avgScore}%`
                    : "—"}
                </Tag>

                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 9999,
                    fontWeight: 600,
                    backgroundColor: "#dcfff1",
                    borderColor: "#7ee2b8",
                    color: "#065f46",
                  }}
                >
                  Pass Rate:{" "}
                  {qm?.passRate !== null && qm?.passRate !== undefined
                    ? `${qm.passRate}%`
                    : "—"}
                </Tag>

                {record.commentsCount > 0 && (
                  <Tag
                    icon={<CommentOutlined />}
                    style={{
                      margin: 0,
                      borderRadius: 9999,
                    }}
                  >
                    {record.commentsCount}
                  </Tag>
                )}
              </Space>

              <Button
                size="small"
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() =>
                  setSelectedQuizLesson({
                    id: record.id,
                    title: record.title,
                  })
                }
                style={{
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: "1px 1px 0px 0px #262626",
                }}
              >
                Quiz Analytics
              </Button>
            </div>
          );
        }

        return (
          <Space size={10} wrap>
            {record.lesson_type === "video" && (
              <Tag
                icon={<ClockCircleOutlined />}
                style={{
                  margin: 0,
                  borderRadius: 9999,
                  backgroundColor: "#f5f5f4",
                  borderColor: token.colorBorder,
                  color: token.colorText,
                }}
              >
                Avg. Watch: {record.avgWatchPercent}%
              </Tag>
            )}

            <Tag
              icon={<CommentOutlined />}
              style={{
                margin: 0,
                borderRadius: 9999,
                backgroundColor:
                  record.commentsCount > 0 ? "#eff6ff" : "#f5f5f4",
                borderColor:
                  record.commentsCount > 0 ? "#bfdbfe" : token.colorBorder,
                color:
                  record.commentsCount > 0
                    ? "#1d4ed8"
                    : token.colorTextSecondary,
              }}
            >
              {record.commentsCount} comment
              {record.commentsCount === 1 ? "" : "s"}
            </Tag>
          </Space>
        );
      },
    },
  ];

  // ==========================================
  // COLUMNS FOR TAB 2: STUDENTS ROSTER
  // ==========================================
  const studentColumns: ColumnsType<CourseStudentItem> = [
    {
      title: "Student",
      key: "student",
      width: 260,
      render: (_, record) => (
        <Space size="middle">
          <Avatar
            size={40}
            src={record.student.avatar_url || undefined}
            icon={!record.student.avatar_url ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: "#fef9c3",
              color: token.colorText,
              border: `1px solid ${token.colorText}`,
              fontWeight: 700,
            }}
          >
            {!record.student.avatar_url
              ? record.student.full_name.charAt(0).toUpperCase()
              : null}
          </Avatar>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
              {record.student.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Enrolled & Last Active",
      dataIndex: "enrolledAt",
      key: "enrolledAt",
      width: 180,
      sorter: (a, b) =>
        new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime(),
      render: (enrolledAt: string, record) => (
        <div>
          <Space size={6}>
            <CalendarOutlined
              style={{ color: token.colorTextSecondary, fontSize: 12 }}
            />
            <Text style={{ fontSize: 13 }}>
              {new Date(enrolledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </Space>
          <div>
            <Text type="secondary" style={{ fontSize: 11.5 }}>
              Active: {formatRelativeActivity(record.lastActivityAt)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Lesson Progress",
      key: "progress",
      width: 220,
      sorter: (a, b) => a.progressPercent - b.progressPercent,
      render: (_, record) => {
        const isCompleted = record.progressPercent === 100;
        return (
          <div style={{ width: "100%", maxWidth: 195 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.completedLessons}/{record.totalLessons} lessons
              </Text>
              <Text
                strong
                style={{
                  fontSize: 12,
                  color: isCompleted ? "#059669" : token.colorText,
                }}
              >
                {record.progressPercent}%
              </Text>
            </div>
            <Progress
              percent={record.progressPercent}
              showInfo={false}
              size="small"
              strokeColor={isCompleted ? "#059669" : token.colorPrimary}
            />
          </div>
        );
      },
    },
    {
      title: "Quiz Performance",
      key: "quizScore",
      width: 175,
      sorter: (a, b) => (a.avgQuizScore ?? -1) - (b.avgQuizScore ?? -1),
      render: (_, record) => {
        if (metrics.totalQuizzes === 0) {
          return (
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              No quizzes in course
            </Text>
          );
        }

        return (
          <div>
            <Text strong style={{ fontSize: 13.5, display: "block" }}>
              {record.avgQuizScore !== null && record.avgQuizScore !== undefined
                ? `Avg: ${record.avgQuizScore}%`
                : "Not attempted"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Passed {record.passedQuizzesCount ?? 0} /{" "}
              {record.totalQuizzesCount ?? metrics.totalQuizzes} quizzes
            </Text>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => {
        if (record.progressPercent === 100) {
          return (
            <Tag
              icon={<CheckCircleFilled />}
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                backgroundColor: "#dcfff1",
                color: "#065f46",
                border: "1px solid #7ee2b8",
              }}
            >
              Completed
            </Tag>
          );
        }
        if (record.completedLessons > 0) {
          return (
            <Tag
              icon={<ClockCircleOutlined />}
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              In Progress
            </Tag>
          );
        }
        return (
          <Tag
            style={{
              borderRadius: 9999,
              fontWeight: 600,
              fontSize: 11,
              backgroundColor: "#f5f5f5",
              color: token.colorTextSecondary,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            Not Started
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      align: "right",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedStudent(record)}
          style={{
            borderRadius: 4,
            fontWeight: 600,
            borderColor: token.colorText,
            boxShadow: "1px 1px 0px 0px #262626",
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: token.colorBgLayout, // #fcfff7 Cream
        padding: "28px 24px 64px 24px",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Navigation Breadcrumb */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            {
              title: (
                <Link to="/teacher/courses">
                  <Space size={4}>
                    <BookOutlined />
                    <span>Teaching Workspace</span>
                  </Space>
                </Link>
              ),
            },
            {
              title: course?.title || "Course Details",
            },
            {
              title: "Analytics & Learners",
            },
          ]}
        />

        {/* 1. Header Hero Banner */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            padding: "24px 32px",
            boxShadow: "1px 1px 0px 0px #262626",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Space size="middle" align="center" style={{ marginBottom: 8 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/teacher/courses")}
                style={{ borderRadius: 4 }}
              >
                Back to Courses
              </Button>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  backgroundColor: "#dcfff1",
                  color: "#065f46",
                  border: "1px solid #7ee2b8",
                }}
              >
                COURSE ANALYTICS
              </Tag>
            </Space>

            <Title
              level={2}
              style={{
                margin: "4px 0 6px 0",
                fontSize: 26,
                letterSpacing: -0.5,
              }}
            >
              {loading && !course
                ? "Loading Course Analytics..."
                : course?.title || "Course Analytics"}
            </Title>
            <Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: 14, maxWidth: 680 }}
            >
              Monitor lesson-by-lesson view counts, inspect quiz average scores
              and hardest questions, and track individual student progress.
            </Paragraph>
          </div>

          <Space size="middle" wrap>
            {course && (
              <Link to={`/teacher/courses/${course.id}/builder`}>
                <Button
                  icon={<UnorderedListOutlined />}
                  style={{ borderRadius: 4, fontWeight: 600 }}
                >
                  Curriculum Builder
                </Button>
              </Link>
            )}

            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              disabled={students.length === 0}
              style={{
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Export CSV
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => void fetchCourseAnalytics()}
              loading={loading}
              style={{ borderRadius: 4 }}
            />
          </Space>
        </div>

        {/* 2. Top 4 KPI Metric Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} lg={6}>
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                boxShadow: "1px 1px 0px 0px #262626",
              }}
              styles={{ body: { padding: "16px 20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TeamOutlined style={{ fontSize: 20, color: "#1d4ed8" }} />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    Total Learners
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}
                  >
                    {loading ? "..." : metrics.total}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {metrics.completed} graduated • {metrics.inProgress} active
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} lg={6}>
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                boxShadow: "1px 1px 0px 0px #262626",
              }}
              styles={{ body: { padding: "16px 20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    backgroundColor: "#dcfff1",
                    border: "1px solid #7ee2b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrophyOutlined style={{ fontSize: 20, color: "#065f46" }} />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    Avg. Course Progress
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}
                  >
                    {loading ? "..." : `${metrics.avgProgress}%`}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {metrics.totalChapters} chapters • {metrics.totalLessons}{" "}
                    lessons
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} lg={6}>
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                boxShadow: "1px 1px 0px 0px #262626",
              }}
              styles={{ body: { padding: "16px 20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AimOutlined style={{ fontSize: 20, color: "#b45309" }} />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    Avg. Quiz Score
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}
                  >
                    {loading
                      ? "..."
                      : metrics.avgQuizScore !== null
                        ? `${metrics.avgQuizScore}%`
                        : "—"}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {metrics.quizPassRate !== null
                      ? `${metrics.quizPassRate}% pass rate (${metrics.totalQuizAttempts} tries)`
                      : `${metrics.totalQuizzes} quizzes configured`}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} lg={6}>
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                boxShadow: "1px 1px 0px 0px #262626",
              }}
              styles={{ body: { padding: "16px 20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    backgroundColor: "#f3e8ff",
                    border: "1px solid #e9d5ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CommentOutlined style={{ fontSize: 20, color: "#7e22ce" }} />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    Lesson Comments
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}
                  >
                    {loading ? "..." : metrics.totalComments}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Total Q&A discussions
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Primary 2-Tab Navigation Switcher */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            borderBottom: `2px solid ${token.colorBorder}`,
            paddingBottom: 12,
          }}
        >
          <Button
            size="large"
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab("analytics")}
            style={{
              borderRadius: 4,
              fontWeight: 700,
              backgroundColor:
                activeTab === "analytics"
                  ? token.colorPrimary
                  : token.colorBgContainer,
              color: token.colorText,
              border: `1px solid ${
                activeTab === "analytics" ? token.colorText : token.colorBorder
              }`,
              boxShadow:
                activeTab === "analytics" ? "2px 2px 0px 0px #262626" : "none",
            }}
          >
            1. Lesson & Quiz Analytics ({metrics.totalLessons})
          </Button>

          <Button
            size="large"
            icon={<TeamOutlined />}
            onClick={() => setActiveTab("students")}
            style={{
              borderRadius: 4,
              fontWeight: 700,
              backgroundColor:
                activeTab === "students"
                  ? token.colorPrimary
                  : token.colorBgContainer,
              color: token.colorText,
              border: `1px solid ${
                activeTab === "students" ? token.colorText : token.colorBorder
              }`,
              boxShadow:
                activeTab === "students" ? "2px 2px 0px 0px #262626" : "none",
            }}
          >
            2. Enrolled Students List ({metrics.total})
          </Button>
        </div>

        {/* ============================================================
            TAB 1 CONTENT: LESSON-BY-LESSON & QUIZ ANALYTICS
           ============================================================ */}
        {activeTab === "analytics" && (
          <div>
            {/* Filter Toolbar for Lesson Types */}
            <div
              style={{
                backgroundColor: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                padding: "14px 20px",
                marginBottom: 20,
                boxShadow: "1px 1px 0px 0px #262626",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Segmented
                value={lessonTypeFilter}
                onChange={(val) => setLessonTypeFilter(val as LessonTypeFilter)}
                options={[
                  {
                    label: `All Lessons (${lessonTypeCounts.all})`,
                    value: "all",
                  },
                  {
                    label: `Video Lessons (${lessonTypeCounts.video})`,
                    value: "video",
                  },
                  {
                    label: `Text / PDF (${lessonTypeCounts.text})`,
                    value: "text",
                  },
                  {
                    label: `Quizzes (${lessonTypeCounts.quiz})`,
                    value: "quiz",
                  },
                ]}
                style={{ fontWeight: 600 }}
              />

              <Text type="secondary" style={{ fontSize: 13 }}>
                Click <strong>Quiz Analytics</strong> on any quiz row to view
                average scores, pass rates, and most-missed questions.
              </Text>
            </div>

            {loading ? (
              <Card
                style={{
                  borderRadius: 8,
                  borderColor: token.colorBorder,
                  boxShadow: "1px 1px 0px 0px #262626",
                }}
              >
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            ) : filteredChapters.length === 0 ? (
              <Card
                style={{
                  borderRadius: 8,
                  borderColor: token.colorBorder,
                  boxShadow: "1px 1px 0px 0px #262626",
                  padding: 24,
                }}
              >
                <Empty description="No lessons match the selected filter." />
              </Card>
            ) : (
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {filteredChapters.map((chapter) => (
                  <Card
                    key={chapter.id}
                    title={
                      <Space size={10}>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 4,
                            fontWeight: 700,
                            backgroundColor: "#262626",
                            color: "#ffffff",
                            border: "none",
                          }}
                        >
                          CHAPTER {chapter.order_index}
                        </Tag>
                        <Text strong style={{ fontSize: 16 }}>
                          {chapter.title}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Text type="secondary" style={{ fontSize: 12.5 }}>
                        {chapter.lessons.length} lesson
                        {chapter.lessons.length === 1 ? "" : "s"}
                      </Text>
                    }
                    styles={{ body: { padding: 0 } }}
                    style={{
                      borderRadius: 8,
                      borderColor: token.colorBorder,
                      boxShadow: "1px 1px 0px 0px #262626",
                      overflow: "hidden",
                    }}
                  >
                    <Table<LessonAnalyticsItem>
                      rowKey="id"
                      columns={lessonColumns}
                      dataSource={chapter.lessons}
                      pagination={false}
                      size="middle"
                    />
                  </Card>
                ))}
              </Space>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2 CONTENT: ENROLLED STUDENTS ROSTER
           ============================================================ */}
        {activeTab === "students" && (
          <div>
            {/* Filter & Search Toolbar */}
            <div
              style={{
                backgroundColor: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 20,
                boxShadow: "1px 1px 0px 0px #262626",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <Segmented
                value={statusFilter}
                onChange={(val) =>
                  setStatusFilter(val as "all" | "in_progress" | "completed")
                }
                options={[
                  { label: `All Students (${metrics.total})`, value: "all" },
                  {
                    label: `In Progress (${metrics.inProgress + metrics.notStarted})`,
                    value: "in_progress",
                  },
                  {
                    label: `Completed (${metrics.completed})`,
                    value: "completed",
                  },
                ]}
                style={{ fontWeight: 600 }}
              />

              <Space size="middle">
                <Input
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextSecondary }}
                    />
                  }
                  placeholder="Search student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  style={{ width: 260, borderRadius: 4 }}
                />
              </Space>
            </div>

            {/* Students Table */}
            <Card
              style={{
                borderRadius: 8,
                borderColor: token.colorBorder,
                boxShadow: "1px 1px 0px 0px #262626",
                backgroundColor: token.colorBgContainer,
              }}
              styles={{ body: { padding: 0 } }}
            >
              {loading && students.length === 0 ? (
                <div style={{ padding: "32px" }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
              ) : (
                <Table<CourseStudentItem>
                  rowKey="enrollmentId"
                  columns={studentColumns}
                  dataSource={filteredStudents}
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} students`,
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          searchTerm || statusFilter !== "all" ? (
                            <Text type="secondary">
                              No students match your filter criteria.
                            </Text>
                          ) : (
                            <Space
                              direction="vertical"
                              size={6}
                              style={{ padding: "36px 0" }}
                            >
                              <Text strong style={{ fontSize: 16 }}>
                                No students enrolled yet
                              </Text>
                              <Text
                                type="secondary"
                                style={{ fontSize: 14, maxWidth: 420 }}
                              >
                                When students enroll in this course, their
                                progress metrics and quiz scores will appear
                                here.
                              </Text>
                            </Space>
                          )
                        }
                      />
                    ),
                  }}
                />
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Drawer 1: Detailed Quiz Assessment Analytics */}
      <QuizAnalyticsDrawer
        open={Boolean(selectedQuizLesson)}
        lessonId={selectedQuizLesson?.id || null}
        lessonTitle={selectedQuizLesson?.title || ""}
        onClose={() => setSelectedQuizLesson(null)}
      />

      {/* Drawer 2: Individual Student Lesson & Quiz Progress */}
      <StudentProgressDrawer
        open={Boolean(selectedStudent)}
        studentItem={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};
