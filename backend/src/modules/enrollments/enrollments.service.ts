import prisma from "../../prisma";
import {
  user_role,
  enrollment_status,
  lesson_type,
  comment_status,
} from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../common/errors/app-error";

export class EnrollmentsService {
  /**
   * Helper tìm khóa học bằng ID hoặc Slug
   */
  private async resolveCourse(courseIdOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        courseIdOrSlug,
      );

    const course = await prisma.courses.findFirst({
      where: isUuid
        ? { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] }
        : { slug: courseIdOrSlug },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        lecturer_id: true,
        thumbnail_url: true,
        price: true,
        level: true,
      },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    return course;
  }

  /**
   * Helper tìm ID bài học đầu tiên của khóa học để điều hướng
   */
  private async getFirstLessonId(courseId: string): Promise<string | null> {
    const firstChapter = await prisma.chapters.findFirst({
      where: { course_id: courseId },
      orderBy: { order_index: "asc" },
      select: {
        lessons: {
          orderBy: { order_index: "asc" },
          take: 1,
          select: { id: true },
        },
      },
    });

    return firstChapter?.lessons[0]?.id || null;
  }

  /**
   * 1. Ghi danh khóa học (Student / Lecturer / Admin)
   */
  async enrollCourse(userId: string, courseIdOrSlug: string) {
    const course = await this.resolveCourse(courseIdOrSlug);

    // Chỉ cho phép ghi danh khóa học đã xuất bản (published)
    if (course.status !== "published") {
      throw new BadRequestError("This course is not open for enrollment");
    }

    // Tạm thời chỉ cho phép ghi danh trực tiếp các khóa học miễn phí (price = 0 hoặc null).
    // Khóa học có phí sẽ yêu cầu thanh toán qua Module Payment sau.
    const coursePrice = Number(course.price || 0);
    if (coursePrice > 0) {
      throw new BadRequestError(
        "Direct enrollment is currently available for free courses only. Paid courses will be supported in the upcoming Payment module.",
      );
    }

    // Kiểm tra bản ghi ghi danh hiện tại
    const existingEnrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: course.id,
        },
      },
    });

    let enrollment = existingEnrollment;

    if (existingEnrollment) {
      // Nếu đã từng hủy, kích hoạt lại thành active
      if (existingEnrollment.status !== enrollment_status.active) {
        enrollment = await prisma.enrollments.update({
          where: { id: existingEnrollment.id },
          data: {
            status: enrollment_status.active,
            enrolled_at: new Date(),
          },
        });
      }
    } else {
      enrollment = await prisma.enrollments.create({
        data: {
          user_id: userId,
          course_id: course.id,
          status: enrollment_status.active,
        },
      });
    }

    const firstLessonId = await this.getFirstLessonId(course.id);

    return {
      enrollment,
      courseSlug: course.slug,
      firstLessonId,
    };
  }

  /**
   * 2. Kiểm tra trạng thái ghi danh & tiến độ tổng quan trên một khóa học
   */
  async getEnrollmentStatus(
    userId: string,
    userRole: user_role,
    courseIdOrSlug: string,
  ) {
    const course = await this.resolveCourse(courseIdOrSlug);

    const isAuthor = course.lecturer_id === userId;
    const isAdmin = userRole === user_role.admin;

    // Giảng viên sở hữu khóa học hoặc Admin luôn có quyền truy cập phòng học
    if (isAuthor || isAdmin) {
      const firstLessonId = await this.getFirstLessonId(course.id);
      return {
        isEnrolled: true,
        isAuthor: true,
        status: enrollment_status.active,
        progressPercent: 100,
        completedLessons: 0,
        totalLessons: 0,
        firstLessonId,
      };
    }

    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: course.id,
        },
      },
    });

    if (!enrollment || enrollment.status === enrollment_status.cancelled) {
      return {
        isEnrolled: false,
        isAuthor: false,
        status: null,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 0,
        firstLessonId: null,
      };
    }

    // Đếm tổng số bài học trong khóa học
    const totalLessons = await prisma.lessons.count({
      where: {
        chapters: {
          course_id: course.id,
        },
      },
    });

    // Đếm số bài học người dùng đã hoàn thành
    const completedLessons = await prisma.lesson_progress.count({
      where: {
        user_id: userId,
        is_completed: true,
        lessons: {
          chapters: {
            course_id: course.id,
          },
        },
      },
    });

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const firstLessonId = await this.getFirstLessonId(course.id);

    return {
      isEnrolled: true,
      isAuthor: false,
      status: enrollment.status,
      progressPercent,
      completedLessons,
      totalLessons,
      firstLessonId,
    };
  }

  /**
   * 3. Lấy danh sách các khóa học đã ghi danh của học viên kèm % tiến độ
   */
  async getMyEnrolledCourses(userId: string) {
    const enrollments = await prisma.enrollments.findMany({
      where: {
        user_id: userId,
        status: { in: [enrollment_status.active, enrollment_status.completed] },
      },
      orderBy: { enrolled_at: "desc" },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            level: true,
            price: true,
            users: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
              },
            },
            chapters: {
              select: {
                lessons: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    // Tính toán tiến độ cho từng khóa học
    const results = await Promise.all(
      enrollments.map(async (item) => {
        const course = item.courses;
        // Tổng số bài học
        const totalLessons = course.chapters.reduce(
          (acc, ch) => acc + ch.lessons.length,
          0,
        );

        // Đếm số bài đã hoàn thành
        const completedLessons = await prisma.lesson_progress.count({
          where: {
            user_id: userId,
            is_completed: true,
            lessons: {
              chapters: {
                course_id: course.id,
              },
            },
          },
        });

        const progressPercent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          id: item.id,
          enrolled_at: item.enrolled_at,
          status: item.status,
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            instructor: course.users,
          },
          totalLessons,
          completedLessons,
          progressPercent,
        };
      }),
    );

    return results;
  }

  /**
   * 3.1 Lấy thống kê học tập tổng quan, Heatmap hoạt động và bài học tiếp tục (Student Learning Stats)
   */
  async getMyLearningStats(userId: string) {
    const formatLocalDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // 1. Tải song song danh sách khóa học đã ghi danh, toàn bộ tiến độ bài học và các lần nộp quiz
    const [enrollments, allProgress, allQuizAttempts] = await Promise.all([
      prisma.enrollments.findMany({
        where: {
          user_id: userId,
          status: {
            in: [enrollment_status.active, enrollment_status.completed],
          },
        },
        orderBy: { enrolled_at: "desc" },
        include: {
          courses: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail_url: true,
              chapters: {
                orderBy: { order_index: "asc" },
                select: {
                  id: true,
                  title: true,
                  order_index: true,
                  lessons: {
                    orderBy: { order_index: "asc" },
                    select: {
                      id: true,
                      title: true,
                      lesson_type: true,
                      duration_seconds: true,
                      order_index: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.lesson_progress.findMany({
        where: { user_id: userId },
        select: {
          lesson_id: true,
          is_completed: true,
          last_watched_position: true,
          updated_at: true,
          lessons: {
            select: {
              id: true,
              title: true,
              lesson_type: true,
              duration_seconds: true,
              order_index: true,
              chapter_id: true,
              chapters: {
                select: {
                  id: true,
                  title: true,
                  order_index: true,
                  course_id: true,
                  courses: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      thumbnail_url: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
      prisma.quiz_attempts.findMany({
        where: {
          user_id: userId,
          submitted_at: { not: null },
        },
        select: {
          id: true,
          quiz_id: true,
          score: true,
          is_passed: true,
          started_at: true,
          submitted_at: true,
        },
        orderBy: { submitted_at: "desc" },
      }),
    ]);

    // 2. Tổng hợp danh sách bài học thuộc các khóa đã ghi danh
    const enrolledCourseMap = new Map<string, (typeof enrollments)[0]["courses"]>();
    const enrolledLessonIds = new Set<string>();
    let totalEnrolledLessons = 0;

    for (const enr of enrollments) {
      const course = enr.courses;
      enrolledCourseMap.set(course.id, course);
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          enrolledLessonIds.add(lesson.id);
          totalEnrolledLessons++;
        }
      }
    }

    // Tiến độ các bài học thuộc các khóa đã ghi danh
    const progressMap = new Map<string, (typeof allProgress)[0]>();
    let completedLessonsCount = 0;
    let videoWatchSeconds = 0;

    for (const prog of allProgress) {
      progressMap.set(prog.lesson_id, prog);
      if (enrolledLessonIds.has(prog.lesson_id)) {
        if (prog.is_completed) {
          completedLessonsCount++;
        }

        const lessonDuration = prog.lessons?.duration_seconds || 0;
        let watched = prog.last_watched_position || 0;

        // Nếu bài học đã được đánh dấu hoàn thành, công nhận toàn bộ thời lượng bài học
        if (prog.is_completed && lessonDuration > 0) {
          watched = Math.max(watched, lessonDuration);
        }

        videoWatchSeconds += watched;
      }
    }

    // Thời gian làm quiz (giây)
    let quizTimeSeconds = 0;
    for (const qa of allQuizAttempts) {
      if (qa.started_at && qa.submitted_at) {
        const diff = Math.floor(
          (qa.submitted_at.getTime() - qa.started_at.getTime()) / 1000,
        );
        if (diff > 0 && diff < 14400) {
          // Chỉ cộng nếu hợp lý dưới 4 tiếng
          quizTimeSeconds += diff;
        }
      }
    }

    const totalWatchTimeSeconds = videoWatchSeconds + quizTimeSeconds;
    const completionRate =
      totalEnrolledLessons > 0
        ? Math.round((completedLessonsCount / totalEnrolledLessons) * 100)
        : 0;

    // Thống kê Quiz
    const totalQuizAttemptsCount = allQuizAttempts.length;
    const averageQuizScore =
      totalQuizAttemptsCount > 0
        ? Math.round(
            allQuizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) /
              totalQuizAttemptsCount,
          )
        : 0;

    const passedQuizIds = new Set<string>();
    const attemptedQuizIds = new Set<string>();
    for (const q of allQuizAttempts) {
      attemptedQuizIds.add(q.quiz_id);
      if (q.is_passed) {
        passedQuizIds.add(q.quiz_id);
      }
    }

    // 3. Gom hoạt động theo từng ngày để tính Activity Heatmap & Streak
    const activityMap = new Map<
      string,
      { lessonCount: number; quizCount: number }
    >();

    for (const prog of allProgress) {
      if (prog.updated_at) {
        const dateKey = formatLocalDate(new Date(prog.updated_at));
        const item = activityMap.get(dateKey) || {
          lessonCount: 0,
          quizCount: 0,
        };
        item.lessonCount++;
        activityMap.set(dateKey, item);
      }
    }

    for (const qa of allQuizAttempts) {
      if (qa.submitted_at) {
        const dateKey = formatLocalDate(new Date(qa.submitted_at));
        const item = activityMap.get(dateKey) || {
          lessonCount: 0,
          quizCount: 0,
        };
        item.quizCount++;
        activityMap.set(dateKey, item);
      }
    }

    // 4. Tính toán Streak (chuỗi ngày học liên tục)
    const now = new Date();
    const activeDatesSet = new Set<string>();
    for (const [dateKey, counts] of activityMap.entries()) {
      if (counts.lessonCount + counts.quizCount > 0) {
        activeDatesSet.add(dateKey);
      }
    }

    let streakDays = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);

    const todayStr = formatLocalDate(cursor);
    const hasToday = activeDatesSet.has(todayStr);

    if (!hasToday) {
      // Nếu hôm nay chưa học, kiểm tra ngày hôm qua
      cursor.setDate(cursor.getDate() - 1);
      const yesterdayStr = formatLocalDate(cursor);
      if (activeDatesSet.has(yesterdayStr)) {
        while (activeDatesSet.has(formatLocalDate(cursor))) {
          streakDays++;
          cursor.setDate(cursor.getDate() - 1);
        }
      } else {
        streakDays = 0;
      }
    } else {
      // Hôm nay có học -> đếm lùi từ hôm nay
      while (activeDatesSet.has(formatLocalDate(cursor))) {
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // 5. Tạo dữ liệu Heatmap cho 18 tuần gần nhất (~4 tháng)
    const weeksCount = 18;
    const dayOfWeek = now.getDay(); // 0: Sunday, 1: Monday, ...
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (weeksCount * 7 + dayOfWeek));
    startDate.setHours(0, 0, 0, 0);

    const heatmapDays: Array<{
      date: string;
      count: number;
      level: number;
      lessonCount: number;
      quizCount: number;
    }> = [];

    let totalActiveDays = 0;
    let totalActivitiesInPeriod = 0;

    const dayCursor = new Date(startDate);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    while (dayCursor <= todayEnd) {
      const dStr = formatLocalDate(dayCursor);
      const act = activityMap.get(dStr) || { lessonCount: 0, quizCount: 0 };
      const count = act.lessonCount + act.quizCount;

      let level = 0;
      if (count >= 6) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      if (count > 0) {
        totalActiveDays++;
        totalActivitiesInPeriod += count;
      }

      heatmapDays.push({
        date: dStr,
        count,
        level,
        lessonCount: act.lessonCount,
        quizCount: act.quizCount,
      });

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    // 6. Xác định bài học gần nhất để tiếp tục (Quick Resume)
    let lastLesson: {
      courseId: string;
      courseTitle: string;
      courseSlug: string;
      courseThumbnailUrl: string | null;
      chapterId: string;
      chapterTitle: string;
      lessonId: string;
      lessonTitle: string;
      lessonType: string;
      durationSeconds: number;
      lastWatchedPosition: number;
      isCompleted: boolean;
      progressPercent: number;
      updatedAt: string | null;
      resumeUrl: string;
      isNextLesson: boolean;
    } | null = null;

    // Tìm khóa học có hoạt động gần nhất
    let latestEnrolledCourse: (typeof enrollments)[0]["courses"] | null = null;
    let latestProgressItem: (typeof allProgress)[0] | null = null;

    for (const prog of allProgress) {
      const cId = prog.lessons?.chapters?.course_id;
      if (cId && enrolledCourseMap.has(cId)) {
        latestEnrolledCourse = enrolledCourseMap.get(cId)!;
        latestProgressItem = prog;
        break;
      }
    }

    // Nếu chưa có tiến độ bài học nào, lấy khóa học được ghi danh đầu tiên
    if (!latestEnrolledCourse && enrollments.length > 0) {
      latestEnrolledCourse = enrollments[0].courses;
    }

    if (latestEnrolledCourse) {
      // Thu thập tất cả bài học trong khóa học này theo thứ tự
      const courseLessonsFlat: Array<{
        id: string;
        title: string;
        lesson_type: string;
        duration_seconds: number | null;
        chapterId: string;
        chapterTitle: string;
      }> = [];

      for (const ch of latestEnrolledCourse.chapters) {
        for (const ls of ch.lessons) {
          courseLessonsFlat.push({
            id: ls.id,
            title: ls.title,
            lesson_type: ls.lesson_type,
            duration_seconds: ls.duration_seconds,
            chapterId: ch.id,
            chapterTitle: ch.title,
          });
        }
      }

      // Đếm số bài đã xong trong khóa học này
      const courseCompletedCount = courseLessonsFlat.filter(
        (ls) => progressMap.get(ls.id)?.is_completed,
      ).length;
      const courseProgressPercent =
        courseLessonsFlat.length > 0
          ? Math.round(
              (courseCompletedCount / courseLessonsFlat.length) * 100,
            )
          : 0;

      // Xác định bài học gợi ý tiếp tục:
      // Tìm bài học đầu tiên chưa hoàn thành
      const nextUncompletedLesson = courseLessonsFlat.find(
        (ls) => !progressMap.get(ls.id)?.is_completed,
      );

      if (nextUncompletedLesson) {
        const prog = progressMap.get(nextUncompletedLesson.id);
        lastLesson = {
          courseId: latestEnrolledCourse.id,
          courseTitle: latestEnrolledCourse.title,
          courseSlug: latestEnrolledCourse.slug,
          courseThumbnailUrl: latestEnrolledCourse.thumbnail_url,
          chapterId: nextUncompletedLesson.chapterId,
          chapterTitle: nextUncompletedLesson.chapterTitle,
          lessonId: nextUncompletedLesson.id,
          lessonTitle: nextUncompletedLesson.title,
          lessonType: nextUncompletedLesson.lesson_type,
          durationSeconds: nextUncompletedLesson.duration_seconds || 0,
          lastWatchedPosition: prog?.last_watched_position || 0,
          isCompleted: false,
          progressPercent: courseProgressPercent,
          updatedAt: prog?.updated_at ? prog.updated_at.toISOString() : null,
          resumeUrl: `/courses/${latestEnrolledCourse.slug}/learn/${nextUncompletedLesson.id}`,
          isNextLesson: Boolean(latestProgressItem?.is_completed),
        };
      } else if (courseLessonsFlat.length > 0) {
        // Nếu đã hoàn thành tất cả các bài của khóa này, trỏ đến bài học cuối cùng
        const lastFlat = courseLessonsFlat[courseLessonsFlat.length - 1];
        const prog = progressMap.get(lastFlat.id);
        lastLesson = {
          courseId: latestEnrolledCourse.id,
          courseTitle: latestEnrolledCourse.title,
          courseSlug: latestEnrolledCourse.slug,
          courseThumbnailUrl: latestEnrolledCourse.thumbnail_url,
          chapterId: lastFlat.chapterId,
          chapterTitle: lastFlat.chapterTitle,
          lessonId: lastFlat.id,
          lessonTitle: lastFlat.title,
          lessonType: lastFlat.lesson_type,
          durationSeconds: lastFlat.duration_seconds || 0,
          lastWatchedPosition: prog?.last_watched_position || 0,
          isCompleted: true,
          progressPercent: 100,
          updatedAt: prog?.updated_at ? prog.updated_at.toISOString() : null,
          resumeUrl: `/courses/${latestEnrolledCourse.slug}/learn/${lastFlat.id}`,
          isNextLesson: false,
        };
      }
    }

    return {
      metrics: {
        streakDays,
        totalWatchTimeSeconds,
        completedLessons: completedLessonsCount,
        totalLessons: totalEnrolledLessons,
        completionRate,
        averageQuizScore,
        quizzesPassed: passedQuizIds.size,
        totalQuizzesAttempted: attemptedQuizIds.size,
        totalEnrolledCourses: enrollments.length,
        completedCourses: enrollments.filter(
          (e) => e.status === enrollment_status.completed,
        ).length,
      },
      heatmap: {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(now),
        totalWeeks: weeksCount + 1,
        totalDays: heatmapDays.length,
        totalActiveDays,
        totalActivities: totalActivitiesInPeriod,
        days: heatmapDays,
      },
      recentActivity: {
        lastLesson,
      },
    };
  }

  /**
   * 4. Lấy toàn bộ cây dữ liệu khóa học phục vụ Phòng học tập trung (Learning Classroom)
   */
  async getClassroomCourseData(
    userId: string,
    userRole: user_role,
    courseSlug: string,
  ) {
    const course = await this.resolveCourse(courseSlug);

    const isAuthor = course.lecturer_id === userId;
    const isAdmin = userRole === user_role.admin;

    // Kiểm tra quyền: Phải là tác giả, Admin hoặc học viên đã ghi danh
    if (!isAuthor && !isAdmin) {
      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: course.id,
          },
        },
      });

      if (!enrollment || enrollment.status === enrollment_status.cancelled) {
        throw new ForbiddenError(
          "You must be enrolled in this course to access the classroom",
        );
      }
    }

    // Lấy toàn bộ danh sách chương và bài học
    const chapters = await prisma.chapters.findMany({
      where: { course_id: course.id },
      orderBy: { order_index: "asc" },
      include: {
        lessons: {
          orderBy: { order_index: "asc" },
          select: {
            id: true,
            title: true,
            lesson_type: true,
            content_url: true,
            lesson_content: true,
            duration_seconds: true,
            order_index: true,
            chapter_id: true,
          },
        },
      },
    });

    // Lấy tất cả bản ghi tiến độ học của user đối với các bài học trong khóa này
    const progressRecords = await prisma.lesson_progress.findMany({
      where: {
        user_id: userId,
        lessons: {
          chapters: {
            course_id: course.id,
          },
        },
      },
      select: {
        lesson_id: true,
        is_completed: true,
        last_watched_position: true,
      },
    });

    const progressMap = new Map<
      string,
      { is_completed: boolean; last_watched_position: number }
    >();
    for (const p of progressRecords) {
      progressMap.set(p.lesson_id, {
        is_completed: p.is_completed ?? false,
        last_watched_position: p.last_watched_position ?? 0,
      });
    }

    let totalLessons = 0;
    let completedLessons = 0;
    let firstIncompleteLessonId: string | null = null;
    let fallbackFirstLessonId: string | null = null;

    // Ghép dữ liệu tiến độ vào từng bài học
    const enrichedChapters = chapters.map((ch) => {
      const enrichedLessons = ch.lessons.map((lesson) => {
        totalLessons++;
        const prog = progressMap.get(lesson.id) || {
          is_completed: false,
          last_watched_position: 0,
        };

        if (prog.is_completed) {
          completedLessons++;
        } else if (!firstIncompleteLessonId) {
          firstIncompleteLessonId = lesson.id;
        }

        if (!fallbackFirstLessonId) {
          fallbackFirstLessonId = lesson.id;
        }

        return {
          ...lesson,
          is_completed: prog.is_completed,
          last_watched_position: prog.last_watched_position,
        };
      });

      return {
        ...ch,
        lessons: enrichedLessons,
      };
    });

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Bài học nên học tiếp theo (bài chưa xong đầu tiên, hoặc bài đầu tiên)
    const nextLessonId = firstIncompleteLessonId || fallbackFirstLessonId;

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail_url: course.thumbnail_url,
      },
      chapters: enrichedChapters,
      progress: {
        totalLessons,
        completedLessons,
        progressPercent,
        nextLessonId,
      },
    };
  }

  /**
   * 5. Đánh dấu hoàn thành bài học
   */
  async completeLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          select: { course_id: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    if (lesson.lesson_type === lesson_type.quiz) {
      throw new BadRequestError(
        "Quiz lessons cannot be completed manually. You must pass the quiz assessment.",
      );
    }

    const courseId = lesson.chapters.course_id;

    const lessonDuration = lesson.duration_seconds || 0;

    // Cập nhật hoặc tạo mới bản ghi tiến độ
    await prisma.lesson_progress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: true,
        last_watched_position: lessonDuration,
      },
      update: {
        is_completed: true,
        ...(lessonDuration > 0
          ? { last_watched_position: lessonDuration }
          : {}),
      },
    });

    // Kiểm tra xem đã hoàn thành 100% khóa học chưa để chuyển status enrollment sang 'completed'
    const totalLessons = await prisma.lessons.count({
      where: {
        chapters: { course_id: courseId },
      },
    });

    const completedLessons = await prisma.lesson_progress.count({
      where: {
        user_id: userId,
        is_completed: true,
        lessons: {
          chapters: { course_id: courseId },
        },
      },
    });

    if (totalLessons > 0 && completedLessons >= totalLessons) {
      await prisma.enrollments.updateMany({
        where: {
          user_id: userId,
          course_id: courseId,
          status: enrollment_status.active,
        },
        data: {
          status: enrollment_status.completed,
        },
      });
    }

    return {
      success: true,
      lessonId,
      is_completed: true,
      completedLessons,
      totalLessons,
      progressPercent:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 100,
    };
  }

  /**
   * 6. Hủy đánh dấu hoàn thành bài học (Uncomplete)
   */
  async uncompleteLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          select: { course_id: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    if (lesson.lesson_type === lesson_type.quiz) {
      throw new BadRequestError(
        "Quiz lessons cannot be completed manually. You must pass the quiz assessment.",
      );
    }

    const courseId = lesson.chapters.course_id;

    await prisma.lesson_progress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: false,
      },
      update: {
        is_completed: false,
      },
    });

    // Nếu enrollment đang là completed, hoàn về active vì có bài học chưa xong
    await prisma.enrollments.updateMany({
      where: {
        user_id: userId,
        course_id: courseId,
        status: enrollment_status.completed,
      },
      data: {
        status: enrollment_status.active,
      },
    });

    return {
      success: true,
      lessonId,
      is_completed: false,
    };
  }

  /**
   * 7. Cập nhật vị trí xem video hiện tại (last_watched_position tính bằng giây)
   */
  async updateLessonProgress(
    userId: string,
    lessonId: string,
    position: number,
    durationSeconds?: number,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      select: { id: true, duration_seconds: true, lesson_type: true },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    // Tự động đồng bộ thời lượng thực tế của video vào bảng lessons nếu phát hiện video có duration chuẩn xác
    if (
      durationSeconds &&
      durationSeconds > 0 &&
      lesson.lesson_type === lesson_type.video &&
      Math.abs((lesson.duration_seconds || 0) - durationSeconds) > 1
    ) {
      await prisma.lessons.update({
        where: { id: lessonId },
        data: { duration_seconds: durationSeconds },
      });
    }

    await prisma.lesson_progress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId,
        },
      },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        last_watched_position: position,
      },
      update: {
        last_watched_position: position,
      },
    });

    return {
      success: true,
      lessonId,
      last_watched_position: position,
      duration_seconds: durationSeconds || lesson.duration_seconds,
    };
  }

  /**
   * 8. Giảng viên / Admin xem thống kê toàn diện khóa học:
   * - KPI tổng quan khóa học
   * - Thống kê từng bài học & từng bài Quiz (Lượt xem, tỷ lệ hoàn thành, điểm TB Quiz, tỷ lệ Đạt)
   * - Danh sách học viên kèm tiến độ từng bài & bảng điểm Quiz của từng học viên
   */
  async getCourseStudents(
    userId: string,
    userRole: user_role,
    courseIdOrSlug: string,
  ) {
    const course = await this.resolveCourse(courseIdOrSlug);

    const isAuthor = course.lecturer_id === userId;
    const isAdmin = userRole === user_role.admin;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError(
        "You do not have permission to view analytics and students of this course",
      );
    }

    // Chạy đồng thời các truy vấn chính để tối ưu hiệu năng (0 N+1 queries)
    const [chaptersData, enrollments, allProgress, allQuizAttempts] =
      await Promise.all([
        prisma.chapters.findMany({
          where: { course_id: course.id },
          orderBy: { order_index: "asc" },
          include: {
            lessons: {
              orderBy: { order_index: "asc" },
              include: {
                _count: {
                  select: {
                    comments: {
                      where: { status: comment_status.approved },
                    },
                  },
                },
                quizzes: {
                  include: {
                    quiz_question_rules: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.enrollments.findMany({
          where: {
            course_id: course.id,
            status: {
              in: [enrollment_status.active, enrollment_status.completed],
            },
          },
          orderBy: { enrolled_at: "desc" },
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
        }),
        prisma.lesson_progress.findMany({
          where: {
            lessons: {
              chapters: { course_id: course.id },
            },
          },
          select: {
            user_id: true,
            lesson_id: true,
            is_completed: true,
            last_watched_position: true,
            updated_at: true,
          },
        }),
        prisma.quiz_attempts.findMany({
          where: {
            quizzes: {
              lessons: {
                chapters: { course_id: course.id },
              },
            },
          },
          select: {
            id: true,
            quiz_id: true,
            user_id: true,
            attempt_number: true,
            status: true,
            score: true,
            is_passed: true,
            started_at: true,
            submitted_at: true,
          },
        }),
      ]);

    const enrolledUserIds = new Set(enrollments.map((e) => e.user_id));
    const totalStudents = enrollments.length;

    // Tổ chức Map progress theo lesson_id và theo user_id
    const progressByLesson = new Map<
      string,
      Array<{
        user_id: string;
        is_completed: boolean;
        last_watched_position: number;
        updated_at: Date | null;
      }>
    >();

    const progressByUserLesson = new Map<
      string,
      {
        is_completed: boolean;
        last_watched_position: number;
        updated_at: Date | null;
      }
    >();

    for (const p of allProgress) {
      if (!enrolledUserIds.has(p.user_id)) continue;

      const record = {
        user_id: p.user_id,
        is_completed: Boolean(p.is_completed),
        last_watched_position: p.last_watched_position ?? 0,
        updated_at: p.updated_at,
      };

      const list = progressByLesson.get(p.lesson_id) || [];
      list.push(record);
      progressByLesson.set(p.lesson_id, list);

      progressByUserLesson.set(`${p.user_id}:${p.lesson_id}`, record);
    }

    // Tổ chức Map quiz attempts theo quiz_id và theo user_id + quiz_id
    const attemptsByQuiz = new Map<
      string,
      Array<{
        id: string;
        user_id: string;
        attempt_number: number;
        status: string;
        score: number;
        is_passed: boolean;
        started_at: Date | null;
        submitted_at: Date | null;
      }>
    >();

    for (const att of allQuizAttempts) {
      if (!enrolledUserIds.has(att.user_id)) continue;
      const list = attemptsByQuiz.get(att.quiz_id) || [];
      list.push(att);
      attemptsByQuiz.set(att.quiz_id, list);
    }

    // Duyệt qua từng chương & bài học để tính thống kê
    let totalLessons = 0;
    let totalQuizzes = 0;
    let totalComments = 0;
    let allSubmittedQuizScoresSum = 0;
    let allSubmittedQuizAttemptsCount = 0;
    let allPassedQuizAttemptsCount = 0;

    const flatLessonsMeta: Array<{
      lessonId: string;
      lessonTitle: string;
      chapterId: string;
      chapterTitle: string;
      lessonType: lesson_type;
      orderIndex: number;
      durationSeconds: number;
      quizId: string | null;
      quizPassingScore: number | null;
    }> = [];

    const chaptersAnalytics = chaptersData.map((ch) => {
      const lessonsAnalytics = ch.lessons.map((lesson) => {
        totalLessons++;
        const commentsCount = lesson._count.comments;
        totalComments += commentsCount;

        const lessonProgList = progressByLesson.get(lesson.id) || [];
        const completedStudentsCount = lessonProgList.filter(
          (p) => p.is_completed,
        ).length;

        const quizObj = lesson.quizzes[0] || null;
        const quizAttempts = quizObj
          ? attemptsByQuiz.get(quizObj.id) || []
          : [];
        const submittedAttempts = quizAttempts.filter(
          (a) => a.status === "submitted",
        );

        // Học viên được tính là "Đã xem / Đã tham gia" bài học nếu:
        // - Có is_completed = true, hoặc last_watched_position > 0, hoặc đã có ít nhất 1 lần làm quiz
        const viewedStudentIds = new Set<string>();
        for (const p of lessonProgList) {
          if (p.is_completed || p.last_watched_position > 0) {
            viewedStudentIds.add(p.user_id);
          }
        }
        for (const a of quizAttempts) {
          viewedStudentIds.add(a.user_id);
        }

        const viewedStudentsCount = viewedStudentIds.size;
        const completionRate =
          totalStudents > 0
            ? Math.round((completedStudentsCount / totalStudents) * 100)
            : 0;

        // Tính thời lượng xem trung bình cho bài học Video
        const durationSecs = lesson.duration_seconds || 0;
        let avgWatchSeconds = 0;
        let avgWatchPercent = 0;

        if (lesson.lesson_type === lesson_type.video && viewedStudentsCount > 0) {
          let totalWatchedSecs = 0;
          for (const p of lessonProgList) {
            if (p.is_completed && durationSecs > 0) {
              totalWatchedSecs += Math.max(p.last_watched_position, durationSecs);
            } else if (p.last_watched_position > 0) {
              totalWatchedSecs +=
                durationSecs > 0
                  ? Math.min(p.last_watched_position, durationSecs)
                  : p.last_watched_position;
            }
          }
          avgWatchSeconds = Math.round(totalWatchedSecs / viewedStudentsCount);
          avgWatchPercent =
            durationSecs > 0
              ? Math.min(100, Math.round((avgWatchSeconds / durationSecs) * 100))
              : completedStudentsCount > 0
                ? 100
                : 0;
        }

        // Tính thống kê cho bài học Quiz
        let quizMetrics = null;
        if (lesson.lesson_type === lesson_type.quiz) {
          totalQuizzes++;
          const isConfigured = Boolean(
            quizObj && quizObj.quiz_question_rules.length > 0,
          );

          const uniqueStudentIds = new Set(
            submittedAttempts.map((a) => a.user_id),
          );
          const passedStudentIds = new Set(
            submittedAttempts.filter((a) => a.is_passed).map((a) => a.user_id),
          );

          let avgScore: number | null = null;
          let highestScore: number | null = null;
          let lowestScore: number | null = null;

          if (submittedAttempts.length > 0) {
            const scores = submittedAttempts.map((a) => a.score);
            const sum = scores.reduce((acc, s) => acc + s, 0);
            avgScore = Math.round(sum / scores.length);
            highestScore = Math.max(...scores);
            lowestScore = Math.min(...scores);

            allSubmittedQuizScoresSum += sum;
            allSubmittedQuizAttemptsCount += submittedAttempts.length;
            allPassedQuizAttemptsCount += submittedAttempts.filter(
              (a) => a.is_passed,
            ).length;
          }

          const uniqueStudentsAttempted = uniqueStudentIds.size;
          const passedStudentsCount = passedStudentIds.size;
          const passRate =
            uniqueStudentsAttempted > 0
              ? Math.round(
                  (passedStudentsCount / uniqueStudentsAttempted) * 100,
                )
              : null;

          quizMetrics = {
            quizId: quizObj?.id || null,
            isConfigured,
            passingScore: quizObj?.passing_score ?? 60,
            maxAttempts: quizObj?.max_attempts ?? 1,
            totalAttempts: submittedAttempts.length,
            uniqueStudentsAttempted,
            passedStudentsCount,
            avgScore,
            highestScore,
            lowestScore,
            passRate,
          };
        }

        flatLessonsMeta.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          chapterId: ch.id,
          chapterTitle: ch.title,
          lessonType: lesson.lesson_type,
          orderIndex: lesson.order_index,
          durationSeconds: durationSecs,
          quizId: quizObj?.id || null,
          quizPassingScore: quizObj?.passing_score ?? null,
        });

        return {
          id: lesson.id,
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          duration_seconds: durationSecs,
          order_index: lesson.order_index,
          viewedStudentsCount,
          completedStudentsCount,
          completionRate,
          avgWatchSeconds,
          avgWatchPercent,
          commentsCount,
          quizMetrics,
        };
      });

      return {
        id: ch.id,
        title: ch.title,
        order_index: ch.order_index,
        lessons: lessonsAnalytics,
      };
    });

    // Ghép dữ liệu chi tiết cho từng Học viên
    const students = enrollments.map((en) => {
      let completedLessons = 0;
      let latestUpdatedAt: Date | null = en.enrolled_at;
      const studentBestQuizScores: number[] = [];
      let passedQuizzesCount = 0;
      let studentTotalQuizAttempts = 0;

      const lessonBreakdown = flatLessonsMeta.map((meta) => {
        const prog = progressByUserLesson.get(
          `${en.user_id}:${meta.lessonId}`,
        );
        const isCompleted = Boolean(prog?.is_completed);
        const lastWatchedPosition = prog?.last_watched_position ?? 0;

        if (isCompleted) {
          completedLessons++;
        }

        if (
          prog?.updated_at &&
          (!latestUpdatedAt || prog.updated_at > latestUpdatedAt)
        ) {
          latestUpdatedAt = prog.updated_at;
        }

        let quizBestScore: number | null = null;
        let quizAttemptsCount = 0;
        let quizPassed = false;

        if (meta.lessonType === lesson_type.quiz && meta.quizId) {
          const allQuizAtts = (attemptsByQuiz.get(meta.quizId) || []).filter(
            (a) => a.user_id === en.user_id && a.status === "submitted",
          );
          quizAttemptsCount = allQuizAtts.length;
          studentTotalQuizAttempts += quizAttemptsCount;

          if (allQuizAtts.length > 0) {
            quizBestScore = Math.max(...allQuizAtts.map((a) => a.score));
            quizPassed = allQuizAtts.some((a) => a.is_passed);
            studentBestQuizScores.push(quizBestScore);
            if (quizPassed) {
              passedQuizzesCount++;
            }

            for (const att of allQuizAtts) {
              if (
                att.submitted_at &&
                (!latestUpdatedAt || att.submitted_at > latestUpdatedAt)
              ) {
                latestUpdatedAt = att.submitted_at;
              }
            }
          }
        }

        return {
          lessonId: meta.lessonId,
          lessonTitle: meta.lessonTitle,
          chapterId: meta.chapterId,
          chapterTitle: meta.chapterTitle,
          lessonType: meta.lessonType,
          orderIndex: meta.orderIndex,
          durationSeconds: meta.durationSeconds,
          isCompleted,
          lastWatchedPosition,
          updatedAt: prog?.updated_at || null,
          quizBestScore,
          quizAttemptsCount,
          quizPassed,
          quizPassingScore: meta.quizPassingScore,
        };
      });

      const progressPercent =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      const avgQuizScore =
        studentBestQuizScores.length > 0
          ? Math.round(
              studentBestQuizScores.reduce((acc, s) => acc + s, 0) /
                studentBestQuizScores.length,
            )
          : null;

      return {
        enrollmentId: en.id,
        student: en.users,
        enrolledAt: en.enrolled_at,
        status: en.status,
        completedLessons,
        totalLessons,
        progressPercent,
        lastActivityAt: latestUpdatedAt || en.enrolled_at,
        avgQuizScore,
        passedQuizzesCount,
        totalQuizzesCount: totalQuizzes,
        totalQuizAttempts: studentTotalQuizAttempts,
        lessonBreakdown,
      };
    });

    // Tính các chỉ số Overview toàn khóa học
    const completedStudents = students.filter(
      (s) => s.progressPercent === 100,
    ).length;
    const inProgressStudents = students.filter(
      (s) => s.progressPercent > 0 && s.progressPercent < 100,
    ).length;
    const notStartedStudents = students.filter(
      (s) => s.progressPercent === 0,
    ).length;
    const avgCourseProgress =
      totalStudents > 0
        ? Math.round(
            students.reduce((acc, s) => acc + s.progressPercent, 0) /
              totalStudents,
          )
        : 0;

    const avgQuizScore =
      allSubmittedQuizAttemptsCount > 0
        ? Math.round(allSubmittedQuizScoresSum / allSubmittedQuizAttemptsCount)
        : null;

    const quizPassRate =
      allSubmittedQuizAttemptsCount > 0
        ? Math.round(
            (allPassedQuizAttemptsCount / allSubmittedQuizAttemptsCount) * 100,
          )
        : null;

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        level: course.level,
      },
      totalStudents,
      overview: {
        totalStudents,
        completedStudents,
        inProgressStudents,
        notStartedStudents,
        avgCourseProgress,
        totalChapters: chaptersData.length,
        totalLessons,
        totalQuizzes,
        avgQuizScore,
        quizPassRate,
        totalQuizAttempts: allSubmittedQuizAttemptsCount,
        totalComments,
      },
      chapters: chaptersAnalytics,
      students,
    };
  }
}

export const enrollmentsService = new EnrollmentsService();
