import React, { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import {
  getLessonQuizApi,
  startQuizAttemptApi,
  getActiveAttemptApi,
  submitQuizAttemptApi,
  getQuizAttemptResultApi,
  getMyLessonAttemptsApi,
} from '../../../../api/quiz.api';
import type {
  LessonQuizResponseData,
  ActiveAttemptData,
  QuizAttemptReviewData,
  MyAttemptItem,
} from '../../../../types/quiz.types';
import type { QuizEngineProps, QuizViewMode } from './types';
import { QuizLoading } from './QuizLoading';
import { QuizNotConfigured } from './QuizNotConfigured';
import { QuizOverview } from './QuizOverview';
import { QuizTaking } from './QuizTaking';
import { QuizReview } from './QuizReview';

export const QuizEngine: React.FC<QuizEngineProps> = ({
  lessonId,
  lessonTitle,
  isLessonCompleted,
  onLessonPassed,
}) => {
  // Primary states
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<QuizViewMode>('overview');
  const [quizData, setQuizData] = useState<LessonQuizResponseData | null>(null);
  const [myAttempts, setMyAttempts] = useState<MyAttemptItem[]>([]);

  // Taking state
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttemptData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review state
  const [reviewData, setReviewData] = useState<QuizAttemptReviewData | null>(null);
  const [loadingReview, setLoadingReview] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});

  // 1. Fetch initial quiz info & past attempts
  const refreshOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      const [quizRes, attemptsRes] = await Promise.all([
        getLessonQuizApi(lessonId),
        getMyLessonAttemptsApi(lessonId),
      ]);

      if (quizRes.success && quizRes.data) {
        setQuizData(quizRes.data);
      }
      if (attemptsRes.success && attemptsRes.data) {
        setMyAttempts(attemptsRes.data);
      }
    } catch {
      message.error('Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    let isMounted = true;
    getLessonQuizApi(lessonId)
      .then((quizRes) => {
        if (!isMounted) return null;
        if (quizRes.success && quizRes.data) {
          setQuizData(quizRes.data);
        }
        return getMyLessonAttemptsApi(lessonId);
      })
      .then((attemptsRes) => {
        if (!isMounted || !attemptsRes) return;
        if (attemptsRes.success && attemptsRes.data) {
          setMyAttempts(attemptsRes.data);
        }
      })
      .catch(() => {
        if (isMounted) message.error('Failed to load quiz details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  // 2. Countdown Timer logic
  useEffect(() => {
    if (viewMode !== 'taking' || !activeAttempt || remainingSeconds === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (remainingSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      message.warning('Time has expired! Submitting your assessment automatically...');
      autoSubmitRef.current();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, activeAttempt, remainingSeconds]);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Start or Resume Attempt
  const handleStartAttempt = async () => {
    try {
      setLoading(true);
      const res = await startQuizAttemptApi(lessonId);
      if (res.success && res.data) {
        const attempt = res.data;
        setActiveAttempt(attempt);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});

        // Calculate timer
        if (attempt.time_limit_minutes && attempt.time_limit_minutes > 0) {
          const startedAtMs = new Date(attempt.started_at).getTime();
          const elapsedSecs = Math.floor((Date.now() - startedAtMs) / 1000);
          const totalSecs = attempt.time_limit_minutes * 60;
          const left = Math.max(0, totalSecs - elapsedSecs);
          setRemainingSeconds(left);
        } else {
          setRemainingSeconds(null);
        }

        setViewMode('taking');
      } else {
        message.error(res.message || 'Could not start quiz attempt');
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Error starting quiz';
      message.error(errMessage);
    } finally {
      setLoading(false);
    }
  };

  // 4. Resume existing active attempt
  const handleResumeAttempt = async (attemptId: string) => {
    try {
      setLoading(true);
      const res = await getActiveAttemptApi(attemptId);
      if (res.success && res.data) {
        const attempt = res.data;
        setActiveAttempt(attempt);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});

        if (attempt.time_limit_minutes && attempt.time_limit_minutes > 0) {
          const startedAtMs = new Date(attempt.started_at).getTime();
          const elapsedSecs = Math.floor((Date.now() - startedAtMs) / 1000);
          const totalSecs = attempt.time_limit_minutes * 60;
          const left = Math.max(0, totalSecs - elapsedSecs);
          setRemainingSeconds(left);
        } else {
          setRemainingSeconds(null);
        }

        setViewMode('taking');
      }
    } catch {
      message.error('Failed to resume ongoing quiz');
    } finally {
      setLoading(false);
    }
  };

  // 5. Select Option Handler
  const handleOptionSelect = (questionId: string, optionId: string, isSingle: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isSingle) {
        return { ...prev, [questionId]: [optionId] };
      } else {
        const exists = current.includes(optionId);
        const updated = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [questionId]: updated };
      }
    });
  };

  // 6. View Review Result
  const handleViewReview = async (attemptId: string) => {
    try {
      setLoadingReview(true);
      const res = await getQuizAttemptResultApi(attemptId);
      if (res.success && res.data) {
        setReviewData(res.data);
        setViewMode('review');
      } else {
        message.error('Could not load quiz review');
      }
    } catch {
      message.error('Failed to fetch attempt results');
    } finally {
      setLoadingReview(false);
    }
  };

  // 7. Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    if (!activeAttempt) return;

    try {
      setSubmitting(true);
      const answersPayload = activeAttempt.questions.map((q) => ({
        attempt_question_id: q.id,
        selected_option_ids: selectedAnswers[q.id] || [],
      }));

      const res = await submitQuizAttemptApi(activeAttempt.attempt_id, {
        answers: answersPayload,
      });

      if (res.success && res.data) {
        message.success(
          res.data.is_passed
            ? 'Congratulations! You passed the assessment!'
            : 'Assessment submitted. Review your score below.'
        );

        if (res.data.is_passed && onLessonPassed) {
          onLessonPassed();
        }

        // Fetch detailed review
        await handleViewReview(activeAttempt.attempt_id);
      } else {
        message.error(res.message || 'Failed to submit quiz');
      }
    } catch {
      message.error('Error submitting assessment');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    autoSubmitRef.current = () => {
      if (!submitting) {
        void handleSubmitQuiz();
      }
    };
  });

  // 8. Back to Overview
  const handleBackToOverview = async () => {
    setViewMode('overview');
    setActiveAttempt(null);
    setReviewData(null);
    await refreshOverviewData();
  };

  // Count answered questions
  const answeredCount = activeAttempt
    ? activeAttempt.questions.filter(
        (q) => selectedAnswers[q.id] && selectedAnswers[q.id].length > 0
      ).length
    : 0;

  // ==========================================
  // RENDER 1: LOADING STATE
  // ==========================================
  if (loading && !activeAttempt && !reviewData) {
    return <QuizLoading />;
  }

  // ==========================================
  // RENDER 2: NOT CONFIGURED YET
  // ==========================================
  if (!quizData || !quizData.is_configured || !quizData.quiz) {
    return <QuizNotConfigured />;
  }

  const { quiz, student_summary } = quizData;

  // ==========================================
  // RENDER 3: OVERVIEW VIEW
  // ==========================================
  if (viewMode === 'overview') {
    return (
      <QuizOverview
        quiz={quiz}
        studentSummary={student_summary}
        lessonTitle={lessonTitle}
        isLessonCompleted={isLessonCompleted}
        myAttempts={myAttempts}
        loadingReview={loadingReview}
        onStartAttempt={handleStartAttempt}
        onResumeAttempt={handleResumeAttempt}
        onViewReview={handleViewReview}
      />
    );
  }

  // ==========================================
  // RENDER 4: TAKING ASSESSMENT VIEW
  // ==========================================
  if (viewMode === 'taking' && activeAttempt) {
    return (
      <QuizTaking
        activeAttempt={activeAttempt}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswers={selectedAnswers}
        remainingSeconds={remainingSeconds}
        submitting={submitting}
        answeredCount={answeredCount}
        formatTime={formatTime}
        onSelectOption={handleOptionSelect}
        onQuestionIndexChange={setCurrentQuestionIndex}
        onSubmitQuiz={handleSubmitQuiz}
      />
    );
  }

  // ==========================================
  // RENDER 5: REVIEW / RESULTS VIEW
  // ==========================================
  if (viewMode === 'review' && reviewData) {
    return (
      <QuizReview
        reviewData={reviewData}
        studentSummary={student_summary}
        onBackToOverview={handleBackToOverview}
        onStartAttempt={handleStartAttempt}
      />
    );
  }

  return null;
};
