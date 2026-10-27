import type {
  QuizConfig,
  StudentQuizSummary,
  MyAttemptItem,
  ActiveAttemptData,
  QuizAttemptReviewData,
} from '../../../../types/quiz.types';

export interface QuizEngineProps {
  lessonId: string;
  lessonTitle: string;
  isLessonCompleted?: boolean;
  onLessonPassed?: () => void;
}

export type QuizViewMode = 'overview' | 'taking' | 'review';

export interface QuizOverviewProps {
  quiz: QuizConfig;
  studentSummary?: StudentQuizSummary;
  lessonTitle: string;
  isLessonCompleted?: boolean;
  myAttempts: MyAttemptItem[];
  loadingReview: boolean;
  onStartAttempt: () => void;
  onResumeAttempt: (attemptId: string) => void;
  onViewReview: (attemptId: string) => void;
}

export interface QuizTimerProps {
  remainingSeconds: number | null;
  formatTime: (seconds: number) => string;
}

export interface QuizQuestionGridProps {
  totalQuestions: number;
  questionIds: string[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string[]>;
  onSelectQuestion: (index: number) => void;
}

export interface QuizTakingProps {
  activeAttempt: ActiveAttemptData;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string[]>;
  remainingSeconds: number | null;
  submitting: boolean;
  answeredCount: number;
  formatTime: (seconds: number) => string;
  onSelectOption: (questionId: string, optionId: string, isSingle: boolean) => void;
  onQuestionIndexChange: (index: number | ((prev: number) => number)) => void;
  onSubmitQuiz: () => void;
}

export interface QuizReviewProps {
  reviewData: QuizAttemptReviewData;
  studentSummary?: StudentQuizSummary;
  onBackToOverview: () => void;
  onStartAttempt: () => void;
}
