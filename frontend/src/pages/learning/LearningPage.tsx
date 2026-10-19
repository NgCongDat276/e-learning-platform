import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Skeleton, Result, Button, App, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  getClassroomDataApi,
  completeLessonApi,
  uncompleteLessonApi,
  updateLessonProgressApi,
} from '../../api/enrollment.api';
import type {
  ClassroomData,
  ClassroomLesson,
  ClassroomChapter,
} from '../../types/enrollment.types';
import { LearningHeader } from './components/LearningHeader';
import { VideoPlayer } from './components/VideoPlayer';
import { LessonContent } from './components/LessonContent';
import { LearningSidebar } from './components/LearningSidebar';
import { LearningFooter } from './components/LearningFooter';

export const LearningPage: React.FC = () => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { slug, lessonId } = useParams<{ slug: string; lessonId?: string }>();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [classroomData, setClassroomData] = useState<ClassroomData | null>(null);
  const [activeLesson, setActiveLesson] = useState<ClassroomLesson | null>(null);
  const [activeChapter, setActiveChapter] = useState<ClassroomChapter | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [togglingCompletion, setTogglingCompletion] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Flatten all lessons across all chapters
  const allLessons = useMemo<ClassroomLesson[]>(() => {
    if (!classroomData?.chapters) return [];
    return classroomData.chapters.flatMap((ch) => ch.lessons);
  }, [classroomData]);

  // Current lesson index, previous and next lessons
  const currentIndex = useMemo(() => {
    if (!activeLesson || allLessons.length === 0) return -1;
    return allLessons.findIndex((l) => l.id === activeLesson.id);
  }, [activeLesson, allLessons]);

  const prevLesson = useMemo(() => {
    if (currentIndex <= 0) return null;
    return allLessons[currentIndex - 1];
  }, [currentIndex, allLessons]);

  const nextLesson = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= allLessons.length - 1) return null;
    return allLessons[currentIndex + 1];
  }, [currentIndex, allLessons]);

  // Fetch classroom data
  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setErrorStatus(null);

    try {
      const res = await getClassroomDataApi(slug);
      if (res.success && res.data) {
        setClassroomData(res.data);
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status) {
        setErrorStatus(err.response.status);
      } else {
        message.error('Failed to load classroom curriculum');
      }
    } finally {
      setLoading(false);
    }
  }, [slug, message]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Set active lesson when data or lessonId in URL changes
  useEffect(() => {
    if (!classroomData || classroomData.chapters.length === 0) return;

    if (lessonId) {
      for (const ch of classroomData.chapters) {
        const found = ch.lessons.find((l) => l.id === lessonId);
        if (found) {
          setActiveLesson(found);
          setActiveChapter(ch);
          return;
        }
      }
    }

    // Default target: recommended next incomplete lesson or first lesson
    const targetId =
      classroomData.progress.nextLessonId ||
      classroomData.chapters[0]?.lessons[0]?.id;

    if (targetId) {
      for (const ch of classroomData.chapters) {
        const found = ch.lessons.find((l) => l.id === targetId);
        if (found) {
          setActiveLesson(found);
          setActiveChapter(ch);
          navigate(`/courses/${slug}/learn/${targetId}`, { replace: true });
          return;
        }
      }
    }
  }, [classroomData, lessonId, slug, navigate]);

  // Handle saving video playback position
  const handleSaveProgress = (position: number) => {
    if (!activeLesson) return;
    void updateLessonProgressApi(activeLesson.id, position);
  };

  // Handle video ended: auto mark complete
  const handleVideoEnded = async () => {
    if (!activeLesson) return;
    if (!activeLesson.is_completed) {
      await handleToggleComplete(true);
      message.success('Lesson completed! Awesome progress.');
    }
  };

  // Toggle lesson complete state
  const handleToggleComplete = async (forceComplete?: boolean) => {
    if (!activeLesson || !classroomData) return;
    const shouldComplete =
      forceComplete !== undefined ? forceComplete : !activeLesson.is_completed;

    setTogglingCompletion(true);
    try {
      if (shouldComplete) {
        const res = await completeLessonApi(activeLesson.id);
        if (res.success) {
          const updatedLesson = { ...activeLesson, is_completed: true };
          setActiveLesson(updatedLesson);

          const updatedChapters = classroomData.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons.map((l) =>
              l.id === activeLesson.id ? { ...l, is_completed: true } : l
            ),
          }));

          const newCompletedCount =
            res.data?.completedLessons ??
            classroomData.progress.completedLessons + 1;
          const newPercent =
            res.data?.progressPercent ??
            Math.round(
              (newCompletedCount / classroomData.progress.totalLessons) * 100
            );

          setClassroomData({
            ...classroomData,
            chapters: updatedChapters,
            progress: {
              ...classroomData.progress,
              completedLessons: newCompletedCount,
              progressPercent: newPercent,
            },
          });
        }
      } else {
        const res = await uncompleteLessonApi(activeLesson.id);
        if (res.success) {
          const updatedLesson = { ...activeLesson, is_completed: false };
          setActiveLesson(updatedLesson);

          const updatedChapters = classroomData.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons.map((l) =>
              l.id === activeLesson.id ? { ...l, is_completed: false } : l
            ),
          }));

          const newCompletedCount = Math.max(
            0,
            classroomData.progress.completedLessons - 1
          );
          const newPercent = Math.round(
            (newCompletedCount / classroomData.progress.totalLessons) * 100
          );

          setClassroomData({
            ...classroomData,
            chapters: updatedChapters,
            progress: {
              ...classroomData.progress,
              completedLessons: newCompletedCount,
              progressPercent: newPercent,
            },
          });
        }
      }
    } catch {
      message.error('Failed to update lesson completion status');
    } finally {
      setTogglingCompletion(false);
    }
  };

  // Navigate to another lesson
  const handleSelectLesson = (lesson: ClassroomLesson) => {
    if (activeLesson?.id === lesson.id) return;
    navigate(`/courses/${slug}/learn/${lesson.id}`);
  };

  // Helper format duration
  const formatDuration = (totalSeconds: number | null | undefined) => {
    if (!totalSeconds || totalSeconds <= 0) return 'Self-paced';
    const minutes = Math.ceil(totalSeconds / 60);
    return `${minutes} min`;
  };

  // 1. Loading State (Light Theme)
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: token.colorBgLayout, // #fcfff7
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 64,
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: '16px 24px',
          }}
        >
          <Skeleton.Input active size="small" style={{ width: 280 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', padding: 28, gap: 28 }}>
          <div style={{ flex: 1 }}>
            <Skeleton.Node style={{ width: '100%', height: 460 }} active>
              <div />
            </Skeleton.Node>
            <div style={{ marginTop: 24 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </div>
          <div style={{ width: 340 }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State: 403 Forbidden (Not Enrolled)
  if (errorStatus === 403) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: token.colorBgLayout,
          padding: 24,
        }}
      >
        <Result
          status="403"
          title="Access Restricted"
          subTitle="You must enroll in this course before accessing the learning classroom."
          extra={
            <Link to={`/courses/${slug}`}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowLeftOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: 'var(--shadow-hard)',
                  fontWeight: 700,
                  borderRadius: 4,
                }}
              >
                Go To Course Overview & Enroll
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // 3. Error State: 404 Not Found
  if (errorStatus === 404 || !classroomData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: token.colorBgLayout,
          padding: 24,
        }}
      >
        <Result
          status="404"
          title="Curriculum Not Found"
          subTitle="The course curriculum you are looking for does not exist or has not been published yet."
          extra={
            <Link to="/courses">
              <Button
                type="primary"
                size="large"
                icon={<ArrowLeftOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  color: token.colorText,
                  border: `1px solid ${token.colorText}`,
                  boxShadow: 'var(--shadow-hard)',
                  fontWeight: 700,
                  borderRadius: 4,
                }}
              >
                Browse Other Courses
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const progressPercent = classroomData.progress.progressPercent;
  const completedLessons = classroomData.progress.completedLessons;
  const totalLessons = classroomData.progress.totalLessons;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: token.colorBgLayout, // #fcfff7 (Editorial Cream)
        color: token.colorText, // #262626 (Ink)
        overflowX: 'hidden',
      }}
    >
      {/* 1. TOP HEADER */}
      <LearningHeader
        courseTitle={classroomData.course.title}
        lessonTitle={activeLesson ? activeLesson.title : 'Loading lesson...'}
        courseSlug={classroomData.course.slug}
        progressPercent={progressPercent}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. MAIN LEARNING WORKSPACE AREA (Content + Sidebar) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* 2.1 PRIMARY LESSON CONTENT VIEWPORT */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {activeLesson && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* 1. Full-width Theater Video Player (takes 100% width of remaining left space) */}
              {activeLesson.lesson_type === 'video' && (
                <VideoPlayer
                  lesson={activeLesson}
                  onEnded={() => void handleVideoEnded()}
                  onSaveProgress={handleSaveProgress}
                />
              )}

              {/* 2. Reading, Lecture Notes & Details Container (centered with max-width for comfortable reading) */}
              <div
                style={{
                  flex: 1,
                  padding: '28px 40px 48px 40px',
                  maxWidth: 1040,
                  width: '100%',
                  margin: '0 auto',
                }}
              >
                <LessonContent
                  lesson={activeLesson}
                  chapter={activeChapter}
                  togglingCompletion={togglingCompletion}
                  onToggleComplete={() => void handleToggleComplete()}
                  formatDuration={formatDuration}
                />
              </div>

              {/* Bottom Sticky Lesson Navigation Footer */}
              <LearningFooter
                prevLesson={prevLesson}
                nextLesson={nextLesson}
                onSelectLesson={handleSelectLesson}
              />
            </div>
          )}
        </main>

        {/* 2.2 RIGHT SIDEBAR (COURSE CONTENT TREE) */}
        <LearningSidebar
          chapters={classroomData.chapters}
          activeLessonId={activeLesson?.id}
          totalLessons={totalLessons}
          collapsed={sidebarCollapsed}
          onSelectLesson={handleSelectLesson}
          formatDuration={formatDuration}
        />
      </div>
    </div>
  );
};
