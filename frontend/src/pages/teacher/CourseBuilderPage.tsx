import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Card,
  Button,
  Space,
  Tag,
  Breadcrumb,
  Empty,
  Skeleton,
  Popconfirm,
  Tooltip,
  Divider,
  App,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CloudUploadOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getCourseBySlugApi } from '../../api/course.api';
import {
  getChaptersByCourseApi,
  reorderChaptersApi,
  deleteChapterApi,
} from '../../api/chapter.api';
import {
  reorderLessonsApi,
  deleteLessonApi,
} from '../../api/lesson.api';
import type { CourseDetail } from '../../types/course.types';
import type { Chapter } from '../../types/chapter.types';
import type { Lesson } from '../../types/lesson.types';
import { ChapterModal } from './components/ChapterModal';
import { LessonModal } from './components/LessonModal';
import { QuizConfigModal } from './components/QuizConfigModal';
import { QuestionBankDrawer } from './components/QuestionBankDrawer';

const { Title, Text, Paragraph } = Typography;

export const CourseBuilderPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Chapter Modal state
  const [chapterModalOpen, setChapterModalOpen] = useState<boolean>(false);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);

  // Lesson Modal state
  const [lessonModalOpen, setLessonModalOpen] = useState<boolean>(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeChapterTitle, setActiveChapterTitle] = useState<string>('');

  // Quiz & Question Bank state
  const [questionBankDrawerOpen, setQuestionBankDrawerOpen] = useState<boolean>(false);
  const [quizConfigModalOpen, setQuizConfigModalOpen] = useState<boolean>(false);
  const [quizLessonToConfigure, setQuizLessonToConfigure] = useState<Lesson | null>(null);

  const handleOpenQuizConfig = (lesson: Lesson) => {
    setQuizLessonToConfigure(lesson);
    setQuizConfigModalOpen(true);
  };

  // Fetch course & chapters data
  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseRes, chaptersRes] = await Promise.all([
        getCourseBySlugApi(courseId),
        getChaptersByCourseApi(courseId),
      ]);

      if (courseRes.success && courseRes.data) {
        setCourse(courseRes.data);
      }
      if (chaptersRes.success && chaptersRes.data) {
        setChapters(chaptersRes.data);
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to load course curriculum data');
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, message]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        void fetchData();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [fetchData]);

  // Open Add Chapter
  const handleOpenAddChapter = () => {
    setChapterToEdit(null);
    setChapterModalOpen(true);
  };

  // Open Edit Chapter
  const handleOpenEditChapter = (ch: Chapter) => {
    setChapterToEdit(ch);
    setChapterModalOpen(true);
  };

  // Delete Chapter
  const handleDeleteChapter = async (chId: string) => {
    try {
      const res = await deleteChapterApi(chId);
      if (res.success) {
        message.success('Chapter deleted successfully');
        void fetchData();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to delete chapter');
      }
    }
  };

  // Reorder Chapters Up/Down
  const handleMoveChapter = async (index: number, direction: 'up' | 'down') => {
    if (!courseId) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const items = reordered.map((ch, idx) => ({
      id: ch.id,
      order_index: idx + 1,
    }));

    // Optimistic update
    setChapters(reordered);

    try {
      const res = await reorderChaptersApi({
        course_id: course?.id || courseId,
        items,
      });
      if (res.success && res.data) {
        setChapters(res.data);
      }
    } catch {
      message.error('Failed to update chapter order');
      void fetchData();
    }
  };

  // Open Add Lesson
  const handleOpenAddLesson = (chapter: Chapter) => {
    setActiveChapterId(chapter.id);
    setActiveChapterTitle(chapter.title);
    setLessonToEdit(null);
    setLessonModalOpen(true);
  };

  // Open Edit Lesson
  const handleOpenEditLesson = (chapter: Chapter, lesson: Lesson) => {
    setActiveChapterId(chapter.id);
    setActiveChapterTitle(chapter.title);
    setLessonToEdit(lesson);
    setLessonModalOpen(true);
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const res = await deleteLessonApi(lessonId);
      if (res.success) {
        message.success('Lesson deleted successfully');
        void fetchData();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to delete lesson');
      }
    }
  };

  // Reorder Lessons Up/Down inside a chapter
  const handleMoveLesson = async (
    chapterId: string,
    lessonIndex: number,
    direction: 'up' | 'down'
  ) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.lessons) return;

    const lessons = [...chapter.lessons];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const [moved] = lessons.splice(lessonIndex, 1);
    lessons.splice(targetIndex, 0, moved);

    const items = lessons.map((l, idx) => ({
      id: l.id,
      order_index: idx + 1,
    }));

    // Optimistic local update
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, lessons } : c))
    );

    try {
      const res = await reorderLessonsApi({ chapter_id: chapterId, items });
      if (res.success && res.data) {
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, lessons: res.data } : c))
        );
      }
    } catch {
      message.error('Failed to update lesson order');
      void fetchData();
    }
  };

  const totalLessons = chapters.reduce(
    (acc, ch) => acc + (ch.lessons?.length || 0),
    0
  );

  const totalDurationSeconds = chapters.reduce((acc, ch) => {
    const chapterDur =
      ch.lessons?.reduce((d, l) => d + (l.duration_seconds || 0), 0) || 0;
    return acc + chapterDur;
  }, 0);

  const formatTotalDuration = (seconds: number) => {
    if (seconds <= 0) return '0 minutes';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 24 }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* 1. Breadcrumb navigation */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/teacher/courses">Teaching Workspace</Link> },
          { title: course?.title || 'Course Details' },
          { title: 'Curriculum Builder' },
        ]}
      />

      {/* 2. Builder Header Card */}
      <div
        style={{
          marginBottom: 28,
          padding: '24px 28px',
          backgroundColor: token.colorBgContainer,
          borderRadius: 8,
          border: `1px solid ${token.colorBorder}`,
          boxShadow: '1px 1px 0px 0px #262626',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Space size="middle" align="center" style={{ marginBottom: 8 }}>
              <Link to="/teacher/courses">
                <Button
                  size="small"
                  icon={<ArrowLeftOutlined />}
                  style={{ borderRadius: 4 }}
                >
                  Back to Courses
                </Button>
              </Link>
              <Tag
                style={{
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  backgroundColor:
                    course?.status === 'published' ? '#dcfff1' : '#fef3c7',
                  color: course?.status === 'published' ? '#059669' : '#b45309',
                  border: `1px solid ${
                    course?.status === 'published' ? '#7ee2b8' : '#fde68a'
                  }`,
                }}
              >
                {course?.status || 'Draft'}
              </Tag>
              {course?.level && (
                <Tag style={{ borderRadius: 9999, textTransform: 'capitalize' }}>
                  {course.level}
                </Tag>
              )}
            </Space>

            <Title
              level={2}
              style={{ margin: 0, fontSize: 26, letterSpacing: -0.6 }}
            >
              Curriculum Builder: {course?.title}
            </Title>
            <Paragraph
              type="secondary"
              style={{ fontSize: 13, margin: '6px 0 0 0' }}
            >
              Organize sequential chapters, craft multimedia lessons, and attach
              assets hosted directly on Cloudflare R2.
            </Paragraph>
          </div>

          {/* Actions: Question Banks & Add Chapter */}
          <Space size="middle">
            <Button
              size="large"
              icon={<DatabaseOutlined />}
              onClick={() => setQuestionBankDrawerOpen(true)}
              style={{
                backgroundColor: token.colorBgContainer,
                color: token.colorText,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 4,
                fontWeight: 600,
                boxShadow: '1px 1px 0px 0px #262626',
              }}
            >
              Question Banks
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleOpenAddChapter}
              style={{
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                border: `1px solid ${token.colorText}`,
                borderRadius: 4,
                fontWeight: 600,
                boxShadow: '2px 2px 0px 0px #262626',
              }}
            >
              Add Chapter
            </Button>
          </Space>
        </div>

        {/* Stats Strip */}
        <Divider style={{ margin: '18px 0 14px 0' }} />
        <Space size="large" wrap>
          <Space size="small">
            <BookOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ fontSize: 13 }}>
              Total Chapters: <Text strong>{chapters.length}</Text>
            </Text>
          </Space>
          <Space size="small">
            <PlayCircleOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ fontSize: 13 }}>
              Total Lessons: <Text strong>{totalLessons}</Text>
            </Text>
          </Space>
          <Space size="small">
            <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ fontSize: 13 }}>
              Total Duration: <Text strong>{formatTotalDuration(totalDurationSeconds)}</Text>
            </Text>
          </Space>
          <Space size="small">
            <CloudUploadOutlined style={{ color: '#059669' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cloudflare R2 Storage: Active
            </Text>
          </Space>
        </Space>
      </div>

      {/* 3. Chapters & Lessons Tree */}
      {chapters.length === 0 ? (
        <div
          style={{
            padding: '64px 24px',
            backgroundColor: token.colorBgContainer,
            borderRadius: 8,
            border: `1px dashed ${token.colorBorder}`,
            textAlign: 'center',
          }}
        >
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  No chapters created yet
                </Text>
                <Text type="secondary">
                  Start building this course curriculum by adding your first chapter.
                </Text>
              </Space>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddChapter}
              style={{
                backgroundColor: token.colorPrimary,
                color: token.colorText,
                border: `1px solid ${token.colorText}`,
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              Add First Chapter
            </Button>
          </Empty>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {chapters.map((chapter, chIdx) => {
            const isFirstChapter = chIdx === 0;
            const isLastChapter = chIdx === chapters.length - 1;
            const chapterLessons = chapter.lessons || [];

            return (
              <Card
                key={chapter.id}
                style={{
                  borderRadius: 8,
                  borderColor: token.colorBorder,
                  backgroundColor: token.colorBgContainer,
                  boxShadow: '1px 1px 0px 0px #262626',
                }}
                styles={{
                  body: { padding: '20px 24px' },
                }}
              >
                {/* Chapter Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tag
                      style={{
                        backgroundColor: '#262626',
                        color: token.colorPrimary,
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 4,
                        padding: '2px 8px',
                        border: 'none',
                      }}
                    >
                      Chapter {chIdx + 1}
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 17, color: token.colorText }}>
                        {chapter.title}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: 'block', marginTop: 2 }}
                      >
                        {chapterLessons.length} lessons in this chapter
                      </Text>
                    </div>
                  </div>

                  {/* Chapter Actions */}
                  <Space size="small">
                    {/* Move Up */}
                    <Tooltip title="Move Chapter Up">
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={isFirstChapter}
                        onClick={() => handleMoveChapter(chIdx, 'up')}
                        style={{ borderRadius: 4 }}
                      />
                    </Tooltip>

                    {/* Move Down */}
                    <Tooltip title="Move Chapter Down">
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={isLastChapter}
                        onClick={() => handleMoveChapter(chIdx, 'down')}
                        style={{ borderRadius: 4 }}
                      />
                    </Tooltip>

                    {/* Edit Chapter */}
                    <Tooltip title="Edit Chapter Title">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEditChapter(chapter)}
                        style={{ borderRadius: 4 }}
                      />
                    </Tooltip>

                    {/* Delete Chapter */}
                    <Popconfirm
                      title="Delete this chapter?"
                      description="This will delete the chapter and all its lessons permanently."
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteChapter(chapter.id)}
                    >
                      <Tooltip title="Delete Chapter">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ borderRadius: 4 }}
                        />
                      </Tooltip>
                    </Popconfirm>

                    {/* Add Lesson Button */}
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAddLesson(chapter)}
                      style={{
                        backgroundColor: token.colorPrimary,
                        color: token.colorText,
                        border: `1px solid ${token.colorText}`,
                        fontWeight: 600,
                        borderRadius: 4,
                        marginLeft: 6,
                      }}
                    >
                      Add Lesson
                    </Button>
                  </Space>
                </div>

                {/* Chapter Lessons List */}
                <div
                  style={{
                    backgroundColor: token.colorBgLayout,
                    borderRadius: 6,
                    padding: 12,
                    border: `1px solid ${token.colorBorder}`,
                  }}
                >
                  {chapterLessons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                        No lessons added yet. Click "+ Add Lesson" to build this chapter.
                      </Text>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {chapterLessons.map((lesson, lIdx) => {
                        const isFirstLesson = lIdx === 0;
                        const isLastLesson = lIdx === chapterLessons.length - 1;

                        const renderTypeIcon = () => {
                          if (lesson.lesson_type === 'quiz') {
                            return <QuestionCircleOutlined style={{ color: '#2563eb', fontSize: 16 }} />;
                          }
                          if (lesson.lesson_type === 'text') {
                            return <FileTextOutlined style={{ color: '#f59e0b', fontSize: 16 }} />;
                          }
                          return <PlayCircleOutlined style={{ color: '#059669', fontSize: 16 }} />;
                        };

                        const durationMinutes = lesson.duration_seconds
                          ? Math.ceil(lesson.duration_seconds / 60)
                          : 0;

                        return (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: token.colorBgContainer,
                              borderRadius: 4,
                              border: `1px solid ${token.colorBorder}`,
                              gap: 12,
                            }}
                          >
                            {/* Left info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 12,
                                  color: token.colorTextSecondary,
                                  width: 28,
                                  flexShrink: 0,
                                }}
                              >
                                {chIdx + 1}.{lIdx + 1}
                              </Text>

                              {renderTypeIcon()}

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <Text strong style={{ fontSize: 14, color: token.colorText, display: 'block' }} ellipsis>
                                  {lesson.title}
                                </Text>
                                <Space size="small" style={{ marginTop: 2 }}>
                                  <Tag style={{ fontSize: 10, borderRadius: 9999, textTransform: 'uppercase' }}>
                                    {lesson.lesson_type}
                                  </Tag>
                                  {durationMinutes > 0 && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      <ClockCircleOutlined style={{ marginRight: 3 }} />
                                      {durationMinutes} min
                                    </Text>
                                  )}
                                  {lesson.content_url && (
                                    <Tag
                                      icon={<CheckCircleOutlined />}
                                      style={{
                                        fontSize: 10,
                                        borderRadius: 9999,
                                        backgroundColor: '#dcfff1',
                                        color: '#065f46',
                                        borderColor: '#7ee2b8',
                                      }}
                                    >
                                      Media Linked
                                    </Tag>
                                  )}
                                </Space>
                              </div>
                            </div>

                            {/* Right action buttons */}
                            <Space size="small" style={{ flexShrink: 0 }}>
                              <Tooltip title="Move Lesson Up">
                                <Button
                                  size="small"
                                  icon={<ArrowUpOutlined />}
                                  disabled={isFirstLesson}
                                  onClick={() => handleMoveLesson(chapter.id, lIdx, 'up')}
                                  style={{ borderRadius: 4 }}
                                />
                              </Tooltip>

                              <Tooltip title="Move Lesson Down">
                                <Button
                                  size="small"
                                  icon={<ArrowDownOutlined />}
                                  disabled={isLastLesson}
                                  onClick={() => handleMoveLesson(chapter.id, lIdx, 'down')}
                                  style={{ borderRadius: 4 }}
                                />
                              </Tooltip>

                              {lesson.lesson_type === 'quiz' && (
                                <Tooltip title="Configure Quiz Rules & Time Limit">
                                  <Button
                                    size="small"
                                    icon={<SettingOutlined />}
                                    onClick={() =>
                                      handleOpenQuizConfig(lesson as unknown as Lesson)
                                    }
                                    style={{
                                      borderRadius: 4,
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      borderColor: '#bfdbfe',
                                    }}
                                  />
                                </Tooltip>
                              )}

                              <Tooltip title="Edit Lesson Details">
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    handleOpenEditLesson(chapter, lesson as unknown as Lesson)
                                  }
                                  style={{ borderRadius: 4 }}
                                />
                              </Tooltip>

                              <Popconfirm
                                title="Delete this lesson?"
                                description="Are you sure you want to remove this lesson?"
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDeleteLesson(lesson.id)}
                              >
                                <Tooltip title="Delete Lesson">
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chapter Form Modal */}
      <ChapterModal
        open={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        onSuccess={() => void fetchData()}
        courseId={course?.id || courseId || ''}
        chapterToEdit={chapterToEdit}
      />

      {/* Lesson Form Modal */}
      <LessonModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        onSuccess={() => void fetchData()}
        chapterId={activeChapterId}
        chapterTitle={activeChapterTitle}
        lessonToEdit={lessonToEdit}
      />

      {/* Quiz Configuration Modal */}
      {quizLessonToConfigure && (
        <QuizConfigModal
          open={quizConfigModalOpen}
          onClose={() => {
            setQuizConfigModalOpen(false);
            setQuizLessonToConfigure(null);
          }}
          lessonId={quizLessonToConfigure.id}
          lessonTitle={quizLessonToConfigure.title}
          courseId={course?.id || courseId || ''}
          onSuccess={() => void fetchData()}
        />
      )}

      {/* Question Bank Drawer */}
      <QuestionBankDrawer
        open={questionBankDrawerOpen}
        onClose={() => setQuestionBankDrawerOpen(false)}
        courseId={course?.id || courseId || ''}
        courseTitle={course?.title || ''}
      />
    </div>
  );
};
