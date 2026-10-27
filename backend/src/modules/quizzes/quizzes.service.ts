import prisma from "../../prisma";
import {
  user_role,
  question_type,
  difficulty,
  enrollment_status,
} from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../common/errors/app-error";
import type {
  CreateQuestionBankInput,
  UpdateQuestionBankInput,
  CreateBankQuestionInput,
  UpdateBankQuestionInput,
  UpsertQuizConfigInput,
  SubmitQuizAttemptInput,
} from "./quizzes.schema";

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class QuizzesService {
  /**
   * Helper 1: Kiểm tra quyền quản lý khóa học (Lecturer sở hữu hoặc Admin)
   */
  private async verifyCourseOwnership(
    courseId: string,
    userId: string,
    userRole: user_role,
  ) {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, lecturer_id: true, title: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (userRole !== user_role.admin && course.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to manage quiz resources for this course",
      );
    }

    return course;
  }

  /**
   * Helper 2: Kiểm tra quyền sở hữu ngân hàng câu hỏi
   */
  private async verifyBankOwnership(
    bankId: string,
    userId: string,
    userRole: user_role,
  ) {
    const bank = await prisma.question_banks.findUnique({
      where: { id: bankId },
      include: {
        courses: {
          select: { id: true, lecturer_id: true },
        },
      },
    });

    if (!bank) {
      throw new NotFoundError("Question bank not found");
    }

    if (userRole !== user_role.admin && bank.courses.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to modify this question bank",
      );
    }

    return bank;
  }

  /**
   * Helper 3: Kiểm tra quyền sở hữu câu hỏi trong ngân hàng
   */
  private async verifyQuestionOwnership(
    questionId: string,
    userId: string,
    userRole: user_role,
  ) {
    const question = await prisma.bank_questions.findUnique({
      where: { id: questionId },
      include: {
        question_banks: {
          include: {
            courses: {
              select: { id: true, lecturer_id: true },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    if (
      userRole !== user_role.admin &&
      question.question_banks.courses.lecturer_id !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to modify this question",
      );
    }

    return question;
  }

  /**
   * Helper 4: Kiểm tra quyền truy cập bài học (Học viên đã ghi danh hoặc Giảng viên/Admin)
   */
  private async verifyLessonAccess(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          include: {
            courses: {
              select: { id: true, lecturer_id: true, status: true, title: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    if (lesson.lesson_type !== "quiz") {
      throw new BadRequestError(
        "This lesson is not configured as a quiz assessment",
      );
    }

    const courseId = lesson.chapters.courses.id;
    const isAuthor =
      userRole === user_role.admin ||
      lesson.chapters.courses.lecturer_id === userId;

    if (isAuthor) {
      return { lesson, isAuthor: true };
    }

    // Kiểm tra enrollment của học viên
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment || enrollment.status === enrollment_status.cancelled) {
      throw new ForbiddenError(
        "You must be enrolled in this course to access this quiz",
      );
    }

    return { lesson, isAuthor: false };
  }

  // ==========================================
  // 1. QUESTION BANKS MANAGEMENT (Lecturer / Admin)
  // ==========================================

  /**
   * Lấy danh sách ngân hàng câu hỏi của một khóa học
   */
  async getCourseQuestionBanks(
    courseId: string,
    userId: string,
    userRole: user_role,
  ) {
    await this.verifyCourseOwnership(courseId, userId, userRole);

    const banks = await prisma.question_banks.findMany({
      where: { course_id: courseId },
      include: {
        _count: {
          select: { bank_questions: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return banks.map((bank) => ({
      id: bank.id,
      course_id: bank.course_id,
      title: bank.title,
      description: bank.description,
      is_active: bank.is_active,
      questions_count: bank._count.bank_questions,
      created_at: bank.created_at,
      updated_at: bank.updated_at,
    }));
  }

  /**
   * Lấy chi tiết một ngân hàng câu hỏi (kèm danh sách câu hỏi & options)
   */
  async getQuestionBankById(
    bankId: string,
    userId: string,
    userRole: user_role,
  ) {
    await this.verifyBankOwnership(bankId, userId, userRole);

    const bank = await prisma.question_banks.findUnique({
      where: { id: bankId },
      include: {
        bank_questions: {
          include: {
            bank_question_options: {
              orderBy: { order_index: "asc" },
            },
          },
          orderBy: { order_index: "asc" },
        },
      },
    });

    return bank;
  }

  /**
   * Tạo ngân hàng câu hỏi mới
   */
  async createQuestionBank(
    courseId: string,
    userId: string,
    userRole: user_role,
    input: CreateQuestionBankInput,
  ) {
    await this.verifyCourseOwnership(courseId, userId, userRole);

    const bank = await prisma.question_banks.create({
      data: {
        course_id: courseId,
        title: input.title,
        description: input.description || null,
        is_active: input.is_active ?? true,
      },
    });

    return bank;
  }

  /**
   * Cập nhật thông tin ngân hàng câu hỏi
   */
  async updateQuestionBank(
    bankId: string,
    userId: string,
    userRole: user_role,
    input: UpdateQuestionBankInput,
  ) {
    await this.verifyBankOwnership(bankId, userId, userRole);

    const updated = await prisma.question_banks.update({
      where: { id: bankId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
        updated_at: new Date(),
      },
    });

    return updated;
  }

  /**
   * Xóa ngân hàng câu hỏi
   */
  async deleteQuestionBank(
    bankId: string,
    userId: string,
    userRole: user_role,
  ) {
    await this.verifyBankOwnership(bankId, userId, userRole);

    await prisma.question_banks.delete({
      where: { id: bankId },
    });

    return { message: "Question bank deleted successfully" };
  }

  // ==========================================
  // 2. BANK QUESTIONS MANAGEMENT (Lecturer / Admin)
  // ==========================================

  /**
   * Thêm câu hỏi mới vào ngân hàng câu hỏi
   */
  async createBankQuestion(
    bankId: string,
    userId: string,
    userRole: user_role,
    input: CreateBankQuestionInput,
  ) {
    await this.verifyBankOwnership(bankId, userId, userRole);

    // Xác định order_index tiếp theo nếu chưa có
    let orderIndex = input.order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const highestOrder = await prisma.bank_questions.findFirst({
        where: { bank_id: bankId },
        orderBy: { order_index: "desc" },
        select: { order_index: true },
      });
      orderIndex = (highestOrder?.order_index || 0) + 1;
    }

    const created = await prisma.$transaction(async (tx) => {
      const question = await tx.bank_questions.create({
        data: {
          bank_id: bankId,
          content: input.content,
          question_type: input.question_type,
          points: input.points ?? 1,
          difficulty: input.difficulty ?? difficulty.easy,
          topic: input.topic || "General",
          order_index: orderIndex!,
        },
      });

      const optionsData = input.options.map((opt, index) => ({
        question_id: question.id,
        content: opt.content,
        is_correct: opt.is_correct,
        order_index: opt.order_index ?? index + 1,
      }));

      await tx.bank_question_options.createMany({
        data: optionsData,
      });

      return tx.bank_questions.findUnique({
        where: { id: question.id },
        include: {
          bank_question_options: {
            orderBy: { order_index: "asc" },
          },
        },
      });
    });

    return created;
  }

  /**
   * Xem chi tiết một câu hỏi
   */
  async getBankQuestionById(
    questionId: string,
    userId: string,
    userRole: user_role,
  ) {
    await this.verifyQuestionOwnership(questionId, userId, userRole);

    const question = await prisma.bank_questions.findUnique({
      where: { id: questionId },
      include: {
        bank_question_options: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return question;
  }

  /**
   * Cập nhật câu hỏi và danh sách options
   */
  async updateBankQuestion(
    questionId: string,
    userId: string,
    userRole: user_role,
    input: UpdateBankQuestionInput,
  ) {
    await this.verifyQuestionOwnership(questionId, userId, userRole);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.bank_questions.update({
        where: { id: questionId },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.question_type !== undefined && {
            question_type: input.question_type,
          }),
          ...(input.points !== undefined && { points: input.points }),
          ...(input.difficulty !== undefined && {
            difficulty: input.difficulty,
          }),
          ...(input.topic !== undefined && { topic: input.topic }),
          ...(input.order_index !== undefined && {
            order_index: input.order_index,
          }),
          updated_at: new Date(),
        },
      });

      if (input.options && input.options.length > 0) {
        // Thay thế toàn bộ options
        await tx.bank_question_options.deleteMany({
          where: { question_id: questionId },
        });

        const optionsData = input.options.map((opt, index) => ({
          question_id: questionId,
          content: opt.content,
          is_correct: opt.is_correct,
          order_index: opt.order_index ?? index + 1,
        }));

        await tx.bank_question_options.createMany({
          data: optionsData,
        });
      }

      return tx.bank_questions.findUnique({
        where: { id: questionId },
        include: {
          bank_question_options: {
            orderBy: { order_index: "asc" },
          },
        },
      });
    });

    return updated;
  }

  /**
   * Xóa câu hỏi khỏi ngân hàng
   */
  async deleteBankQuestion(
    questionId: string,
    userId: string,
    userRole: user_role,
  ) {
    await this.verifyQuestionOwnership(questionId, userId, userRole);

    await prisma.bank_questions.delete({
      where: { id: questionId },
    });

    return { message: "Question deleted successfully" };
  }

  // ==========================================
  // 3. QUIZ LESSON CONFIGURATION (Lecturer / Admin)
  // ==========================================

  /**
   * Lấy cấu hình Quiz của một bài học (kèm rules và thông tin học viên nếu có)
   */
  async getLessonQuiz(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const { lesson, isAuthor } = await this.verifyLessonAccess(
      lessonId,
      userId,
      userRole,
    );

    const quiz = await prisma.quizzes.findFirst({
      where: { lesson_id: lessonId },
      include: {
        quiz_question_rules: {
          include: {
            question_banks: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return {
        is_configured: false,
        lesson_id: lessonId,
        lesson_title: lesson.title,
        quiz: null,
      };
    }

    // Thống kê lịch sử làm bài của học viên hiện tại
    const userAttempts = await prisma.quiz_attempts.findMany({
      where: {
        quiz_id: quiz.id,
        user_id: userId,
      },
      orderBy: { attempt_number: "desc" },
    });

    const attemptsCount = userAttempts.length;
    const bestScore = userAttempts.reduce(
      (max, curr) => (curr.score > max ? curr.score : max),
      0,
    );
    const hasPassed = userAttempts.some((att) => att.is_passed);
    const inProgressAttempt = userAttempts.find(
      (att) => att.status === "in_progress",
    );
    const canAttempt =
      quiz.max_attempts <= 0 || attemptsCount < quiz.max_attempts;

    return {
      is_configured: true,
      lesson_id: lessonId,
      lesson_title: lesson.title,
      is_author: isAuthor,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        time_limit_minutes: quiz.time_limit_minutes,
        max_attempts: quiz.max_attempts,
        shuffle_questions: quiz.shuffle_questions,
        shuffle_options: quiz.shuffle_options,
        show_correct_answers: quiz.show_correct_answers,
        rules: quiz.quiz_question_rules.map((rule) => ({
          id: rule.id,
          bank_id: rule.bank_id,
          bank_title: rule.question_banks.title,
          question_count: rule.question_count,
          difficulty: rule.difficulty,
          topic: rule.topic,
          points_per_question: rule.points_per_question,
        })),
      },
      student_summary: {
        attempts_count: attemptsCount,
        max_attempts: quiz.max_attempts,
        best_score: bestScore,
        is_passed: hasPassed,
        can_attempt: canAttempt,
        active_attempt_id: inProgressAttempt ? inProgressAttempt.id : null,
      },
    };
  }

  /**
   * Cập nhật / Thiết lập cấu hình Quiz cho bài học
   */
  async upsertLessonQuiz(
    lessonId: string,
    userId: string,
    userRole: user_role,
    input: UpsertQuizConfigInput,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          include: {
            courses: {
              select: { id: true, lecturer_id: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    if (
      userRole !== user_role.admin &&
      lesson.chapters.courses.lecturer_id !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to configure quiz for this lesson",
      );
    }

    if (lesson.lesson_type !== "quiz") {
      throw new BadRequestError("This lesson is not marked as a quiz type");
    }

    const existingQuiz = await prisma.quizzes.findFirst({
      where: { lesson_id: lessonId },
    });

    const savedQuiz = await prisma.$transaction(async (tx) => {
      let quizId: string;

      if (existingQuiz) {
        const updated = await tx.quizzes.update({
          where: { id: existingQuiz.id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.passing_score !== undefined && {
              passing_score: input.passing_score,
            }),
            ...(input.time_limit_minutes !== undefined && {
              time_limit_minutes: input.time_limit_minutes,
            }),
            ...(input.max_attempts !== undefined && {
              max_attempts: input.max_attempts,
            }),
            ...(input.shuffle_questions !== undefined && {
              shuffle_questions: input.shuffle_questions,
            }),
            ...(input.shuffle_options !== undefined && {
              shuffle_options: input.shuffle_options,
            }),
            ...(input.show_correct_answers !== undefined && {
              show_correct_answers: input.show_correct_answers,
            }),
            updated_at: new Date(),
          },
        });
        quizId = updated.id;
      } else {
        const created = await tx.quizzes.create({
          data: {
            lesson_id: lessonId,
            title: input.title || lesson.title,
            description: input.description || null,
            passing_score: input.passing_score ?? 60,
            time_limit_minutes: input.time_limit_minutes ?? 15,
            max_attempts: input.max_attempts ?? 1,
            shuffle_questions: input.shuffle_questions ?? true,
            shuffle_options: input.shuffle_options ?? true,
            show_correct_answers: input.show_correct_answers ?? false,
          },
        });
        quizId = created.id;
      }

      // Xử lý rules nếu có
      if (input.rules !== undefined) {
        await tx.quiz_question_rules.deleteMany({
          where: { quiz_id: quizId },
        });

        for (const rule of input.rules) {
          await tx.quiz_question_rules.create({
            data: {
              quiz_id: quizId,
              bank_id: rule.bank_id,
              question_count: rule.question_count,
              difficulty: rule.difficulty ?? difficulty.easy,
              topic: rule.topic || null,
              points_per_question: rule.points_per_question ?? 1,
            },
          });
        }
      }

      return tx.quizzes.findUnique({
        where: { id: quizId },
        include: {
          quiz_question_rules: {
            include: {
              question_banks: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    });

    return savedQuiz;
  }

  // ==========================================
  // 4. STUDENT QUIZ TAKING & AUTO-GRADING
  // ==========================================

  /**
   * Bắt đầu một lượt làm bài kiểm tra trắc nghiệm
   */
  async startQuizAttempt(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const { lesson } = await this.verifyLessonAccess(
      lessonId,
      userId,
      userRole,
    );

    const quiz = await prisma.quizzes.findFirst({
      where: { lesson_id: lessonId },
      include: {
        quiz_question_rules: true,
      },
    });

    if (!quiz) {
      throw new BadRequestError(
        "This quiz has not been configured with questions yet",
      );
    }

    // 1. Kiểm tra xem có attempt nào đang in_progress không
    const existingActive = await prisma.quiz_attempts.findFirst({
      where: {
        quiz_id: quiz.id,
        user_id: userId,
        status: "in_progress",
      },
      include: {
        quiz_attempt_questions: {
          include: {
            bank_questions: {
              include: {
                bank_question_options: {
                  select: {
                    id: true,
                    content: true,
                    order_index: true,
                  },
                  orderBy: { order_index: "asc" },
                },
              },
            },
          },
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (existingActive) {
      // Kiểm tra thời gian còn lại
      if (quiz.time_limit_minutes && quiz.time_limit_minutes > 0) {
        const startedTime = new Date(existingActive.started_at!).getTime();
        const expireTime =
          startedTime + quiz.time_limit_minutes * 60 * 1000 + 60000; // 1 min grace
        if (Date.now() > expireTime) {
          // Tự động kết thúc lượt làm bài đã quá giờ
          await prisma.quiz_attempts.update({
            where: { id: existingActive.id },
            data: {
              status: "submitted",
              submitted_at: new Date(expireTime),
            },
          });
        } else {
          // Trả về attempt đang làm dở
          return this.formatAttemptForStudent(existingActive, quiz);
        }
      } else {
        // Không giới hạn thời gian -> Trả về attempt đang làm dở
        return this.formatAttemptForStudent(existingActive, quiz);
      }
    }

    // 2. Kiểm tra số lần thi
    const pastAttemptsCount = await prisma.quiz_attempts.count({
      where: {
        quiz_id: quiz.id,
        user_id: userId,
      },
    });

    if (quiz.max_attempts > 0 && pastAttemptsCount >= quiz.max_attempts) {
      throw new BadRequestError(
        `You have reached the maximum allowed attempts (${quiz.max_attempts}) for this quiz`,
      );
    }

    // 3. Lựa chọn câu hỏi từ ngân hàng dựa trên rules
    const selectedQuestions: Array<{
      id: string;
      content: string;
      question_type: question_type;
      points: number;
      options: Array<{ id: string; content: string; order_index: number }>;
    }> = [];

    const selectedQuestionIds = new Set<string>();

    if (quiz.quiz_question_rules.length > 0) {
      for (const rule of quiz.quiz_question_rules) {
        const whereClause: any = {
          bank_id: rule.bank_id,
        };
        if (rule.difficulty) {
          whereClause.difficulty = rule.difficulty;
        }
        if (rule.topic) {
          whereClause.topic = rule.topic;
        }

        const candidateQuestions = await prisma.bank_questions.findMany({
          where: whereClause,
          include: {
            bank_question_options: {
              select: {
                id: true,
                content: true,
                order_index: true,
              },
            },
          },
        });

        // Lọc những câu chưa được chọn trong lượt này
        const available = candidateQuestions.filter(
          (q) => !selectedQuestionIds.has(q.id),
        );
        const shuffled = shuffleArray(available);
        const picked = shuffled.slice(0, rule.question_count);

        for (const q of picked) {
          selectedQuestionIds.add(q.id);
          selectedQuestions.push({
            id: q.id,
            content: q.content,
            question_type: q.question_type,
            points: rule.points_per_question ?? q.points,
            options: q.bank_question_options,
          });
        }
      }
    }

    // Fallback: nếu chưa cấu hình rules hoặc rules không đủ câu, lấy trực tiếp từ tất cả các bank của khóa học
    if (selectedQuestions.length === 0) {
      const courseId = lesson.chapters.courses.id;
      const allCourseQuestions = await prisma.bank_questions.findMany({
        where: {
          question_banks: {
            course_id: courseId,
            is_active: true,
          },
        },
        include: {
          bank_question_options: {
            select: {
              id: true,
              content: true,
              order_index: true,
            },
          },
        },
      });

      const shuffled = shuffleArray(allCourseQuestions);
      const picked = shuffled.slice(0, 20); // Mặc định lấy tối đa 20 câu

      for (const q of picked) {
        selectedQuestions.push({
          id: q.id,
          content: q.content,
          question_type: q.question_type,
          points: q.points,
          options: q.bank_question_options,
        });
      }
    }

    if (selectedQuestions.length === 0) {
      throw new BadRequestError(
        "There are no active questions available in the question banks for this quiz",
      );
    }

    // Xáo trộn thứ tự các câu hỏi nếu có cấu hình
    const finalQuestions = quiz.shuffle_questions
      ? shuffleArray(selectedQuestions)
      : selectedQuestions;

    // 4. Lưu lượt làm bài và snapshot câu hỏi vào database
    const newAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quiz_attempts.create({
        data: {
          quiz_id: quiz.id,
          user_id: userId,
          attempt_number: pastAttemptsCount + 1,
          status: "in_progress",
          started_at: new Date(),
        },
      });

      for (let i = 0; i < finalQuestions.length; i++) {
        const q = finalQuestions[i];
        await tx.quiz_attempt_questions.create({
          data: {
            attempt_id: attempt.id,
            bank_question_id: q.id,
            content_snapshot: q.content,
            question_type_snapshot: q.question_type,
            points_snapshot: q.points,
            order_index: i + 1,
          },
        });
      }

      return tx.quiz_attempts.findUnique({
        where: { id: attempt.id },
        include: {
          quiz_attempt_questions: {
            include: {
              bank_questions: {
                include: {
                  bank_question_options: {
                    select: {
                      id: true,
                      content: true,
                      order_index: true,
                    },
                    orderBy: { order_index: "asc" },
                  },
                },
              },
            },
            orderBy: { order_index: "asc" },
          },
        },
      });
    });

    return this.formatAttemptForStudent(newAttempt!, quiz);
  }

  /**
   * Helper định dạng dữ liệu bài làm gửi về cho học viên (ẨN is_correct)
   */
  private formatAttemptForStudent(attempt: any, quiz: any) {
    const formattedQuestions = attempt.quiz_attempt_questions.map((aq: any) => {
      let options = aq.bank_questions.bank_question_options.map((opt: any) => ({
        id: opt.id,
        content: opt.content,
        order_index: opt.order_index,
      }));

      if (quiz.shuffle_options) {
        options = shuffleArray(options);
      }

      return {
        id: aq.id, // attempt_question_id
        order_index: aq.order_index,
        content: aq.content_snapshot,
        question_type: aq.question_type_snapshot,
        points: aq.points_snapshot,
        options,
      };
    });

    return {
      attempt_id: attempt.id,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      attempt_number: attempt.attempt_number,
      started_at: attempt.started_at,
      time_limit_minutes: quiz.time_limit_minutes,
      passing_score: quiz.passing_score,
      max_attempts: quiz.max_attempts,
      total_questions: formattedQuestions.length,
      questions: formattedQuestions,
    };
  }

  /**
   * Lấy thông tin lượt làm bài đang diễn ra (dùng khi refresh trang)
   */
  async getActiveAttempt(
    attemptId: string,
    userId: string,
    userRole: user_role,
  ) {
    const attempt = await prisma.quiz_attempts.findUnique({
      where: { id: attemptId },
      include: {
        quizzes: true,
        quiz_attempt_questions: {
          include: {
            bank_questions: {
              include: {
                bank_question_options: {
                  select: {
                    id: true,
                    content: true,
                    order_index: true,
                  },
                  orderBy: { order_index: "asc" },
                },
              },
            },
          },
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    if (userRole !== user_role.admin && attempt.user_id !== userId) {
      throw new ForbiddenError("You cannot view this quiz attempt");
    }

    return this.formatAttemptForStudent(attempt, attempt.quizzes);
  }

  /**
   * Nộp bài kiểm tra & Chấm điểm tự động
   */
  async submitQuizAttempt(
    attemptId: string,
    userId: string,
    userRole: user_role,
    input: SubmitQuizAttemptInput,
  ) {
    const attempt = await prisma.quiz_attempts.findUnique({
      where: { id: attemptId },
      include: {
        quizzes: true,
        quiz_attempt_questions: {
          include: {
            bank_questions: {
              include: {
                bank_question_options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    if (userRole !== user_role.admin && attempt.user_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to submit this attempt",
      );
    }

    if (attempt.status === "submitted") {
      throw new BadRequestError("This attempt has already been submitted");
    }

    // Chấm điểm từng câu hỏi
    const answersMap = new Map<string, string[]>();
    for (const ans of input.answers) {
      answersMap.set(ans.attempt_question_id, ans.selected_option_ids);
    }

    let totalPossiblePoints = 0;
    let totalEarnedPoints = 0;
    let correctCount = 0;

    const gradingRecords: Array<{
      attempt_question_id: string;
      is_correct: boolean;
      points_earned: number;
      selected_option_ids: string[];
    }> = [];

    for (const aq of attempt.quiz_attempt_questions) {
      totalPossiblePoints += aq.points_snapshot;

      const userSelected = answersMap.get(aq.id) || [];
      const correctOptionIds = aq.bank_questions.bank_question_options
        .filter((o) => o.is_correct)
        .map((o) => o.id);

      let isCorrect = false;

      if (aq.question_type_snapshot === question_type.single_choice) {
        isCorrect =
          userSelected.length === 1 &&
          correctOptionIds.length === 1 &&
          userSelected[0] === correctOptionIds[0];
      } else {
        // multiple_choice: Phải chọn đúng và đủ tất cả đáp án đúng, không chọn thừa đáp án sai
        isCorrect =
          userSelected.length === correctOptionIds.length &&
          userSelected.every((id) => correctOptionIds.includes(id));
      }

      const pointsEarned = isCorrect ? aq.points_snapshot : 0;
      if (isCorrect) {
        correctCount++;
        totalEarnedPoints += pointsEarned;
      }

      gradingRecords.push({
        attempt_question_id: aq.id,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        selected_option_ids: userSelected,
      });
    }

    // Tính điểm phần trăm (0 - 100)
    const scorePercentage =
      totalPossiblePoints > 0
        ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100)
        : 0;

    const isPassed = scorePercentage >= attempt.quizzes.passing_score;

    // Lưu vào database trong transaction
    await prisma.$transaction(async (tx) => {
      // 1. Lưu câu trả lời của từng câu
      for (const g of gradingRecords) {
        const answerRecord = await tx.quiz_attempt_answers.create({
          data: {
            attempt_question_id: g.attempt_question_id,
            is_correct: g.is_correct,
            points_earned: g.points_earned,
          },
        });

        if (g.selected_option_ids.length > 0) {
          await tx.quiz_attempt_answer_options.createMany({
            data: g.selected_option_ids.map((optId) => ({
              attempt_answer_id: answerRecord.id,
              bank_question_option_id: optId,
            })),
          });
        }
      }

      // 2. Cập nhật attempt
      await tx.quiz_attempts.update({
        where: { id: attempt.id },
        data: {
          status: "submitted",
          score: scorePercentage,
          is_passed: isPassed,
          submitted_at: new Date(),
        },
      });

      // 3. Nếu vượt qua bài test, tự động cập nhật tiến độ bài học (Module 5 integration)
      if (isPassed) {
        await tx.lesson_progress.upsert({
          where: {
            user_id_lesson_id: {
              user_id: attempt.user_id,
              lesson_id: attempt.quizzes.lesson_id,
            },
          },
          update: {
            is_completed: true,
            updated_at: new Date(),
          },
          create: {
            user_id: attempt.user_id,
            lesson_id: attempt.quizzes.lesson_id,
            is_completed: true,
          },
        });
      }
    });

    return {
      attempt_id: attempt.id,
      score: scorePercentage,
      is_passed: isPassed,
      passing_score: attempt.quizzes.passing_score,
      total_earned_points: totalEarnedPoints,
      total_possible_points: totalPossiblePoints,
      total_questions: attempt.quiz_attempt_questions.length,
      correct_count: correctCount,
      submitted_at: new Date(),
    };
  }

  /**
   * Xem kết quả bài thi chi tiết (Review)
   */
  async getQuizAttemptResult(
    attemptId: string,
    userId: string,
    userRole: user_role,
  ) {
    const attempt = await prisma.quiz_attempts.findUnique({
      where: { id: attemptId },
      include: {
        quizzes: {
          include: {
            lessons: {
              include: {
                chapters: {
                  include: {
                    courses: {
                      select: { lecturer_id: true, title: true, slug: true },
                    },
                  },
                },
              },
            },
          },
        },
        quiz_attempt_questions: {
          include: {
            quiz_attempt_answers: {
              include: {
                quiz_attempt_answer_options: true,
              },
            },
            bank_questions: {
              include: {
                bank_question_options: {
                  orderBy: { order_index: "asc" },
                },
              },
            },
          },
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    const isCourseAuthor =
      attempt.quizzes.lessons.chapters.courses.lecturer_id === userId;

    if (
      userRole !== user_role.admin &&
      attempt.user_id !== userId &&
      !isCourseAuthor
    ) {
      throw new ForbiddenError(
        "You do not have permission to view this quiz result",
      );
    }

    if (attempt.status !== "submitted") {
      throw new BadRequestError("This quiz attempt has not been submitted yet");
    }

    const showCorrectAnswers =
      attempt.quizzes.show_correct_answers ||
      userRole === user_role.admin ||
      isCourseAuthor;

    const questionsReview = attempt.quiz_attempt_questions.map((aq) => {
      const answer = aq.quiz_attempt_answers;
      const selectedOptionIds =
        answer?.quiz_attempt_answer_options.map(
          (o) => o.bank_question_option_id,
        ) || [];

      const options = aq.bank_questions.bank_question_options.map((opt) => ({
        id: opt.id,
        content: opt.content,
        order_index: opt.order_index,
        is_selected: selectedOptionIds.includes(opt.id),
        ...(showCorrectAnswers && { is_correct: opt.is_correct }),
      }));

      return {
        id: aq.id,
        order_index: aq.order_index,
        content: aq.content_snapshot,
        question_type: aq.question_type_snapshot,
        points_snapshot: aq.points_snapshot,
        points_earned: answer?.points_earned ?? 0,
        is_correct: answer?.is_correct ?? false,
        options,
      };
    });

    return {
      attempt_id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quizzes.title,
      attempt_number: attempt.attempt_number,
      status: attempt.status,
      score: attempt.score,
      is_passed: attempt.is_passed,
      passing_score: attempt.quizzes.passing_score,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      show_correct_answers: showCorrectAnswers,
      questions: questionsReview,
    };
  }

  /**
   * Xem danh sách các lần làm bài thi của học viên cho một bài học
   */
  async getMyLessonAttempts(lessonId: string, userId: string) {
    const quiz = await prisma.quizzes.findFirst({
      where: { lesson_id: lessonId },
    });

    if (!quiz) {
      return [];
    }

    const attempts = await prisma.quiz_attempts.findMany({
      where: {
        quiz_id: quiz.id,
        user_id: userId,
      },
      orderBy: { attempt_number: "desc" },
      select: {
        id: true,
        attempt_number: true,
        status: true,
        score: true,
        is_passed: true,
        started_at: true,
        submitted_at: true,
      },
    });

    return attempts;
  }

  /**
   * Giảng viên / Admin xem danh sách tất cả học viên đã làm bài quiz này
   */
  async getLessonAttemptsForTeacher(
    lessonId: string,
    userId: string,
    userRole: user_role,
    page: number = 1,
    limit: number = 20,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          include: {
            courses: {
              select: { id: true, lecturer_id: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    if (
      userRole !== user_role.admin &&
      lesson.chapters.courses.lecturer_id !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to view attempt statistics for this course",
      );
    }

    const quiz = await prisma.quizzes.findFirst({
      where: { lesson_id: lessonId },
    });

    if (!quiz) {
      return {
        attempts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const [total, attempts] = await Promise.all([
      prisma.quiz_attempts.count({
        where: { quiz_id: quiz.id },
      }),
      prisma.quiz_attempts.findMany({
        where: { quiz_id: quiz.id },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { submitted_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      attempts: attempts.map((att) => ({
        id: att.id,
        attempt_number: att.attempt_number,
        status: att.status,
        score: att.score,
        is_passed: att.is_passed,
        started_at: att.started_at,
        submitted_at: att.submitted_at,
        user: att.users,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

export const quizzesService = new QuizzesService();
