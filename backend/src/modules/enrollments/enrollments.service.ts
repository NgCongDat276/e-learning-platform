import prisma from "../../prisma";
import { user_role, enrollment_status } from "@prisma/client";
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
      // Tạo mới lượt ghi danh
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
      courseId: course.id,
      courseSlug: course.slug,
      firstLessonId,
    };
  }

  /**
   * 2. Lấy trạng thái ghi danh của người dùng đối với một khóa học
   */
  async getEnrollmentStatus(
    userId: string,
    userRole: user_role,
    courseIdOrSlug: string,
  ) {
    const course = await this.resolveCourse(courseIdOrSlug);

    const isAuthor = course.lecturer_id === userId;
    const isAdmin = userRole === user_role.admin;

    // Giảng viên của khóa học hoặc Admin mặc định có toàn quyền truy cập
    if (isAuthor || isAdmin) {
      const firstLessonId = await this.getFirstLessonId(course.id);
      return {
        isEnrolled: true,
        isAuthor,
        status: enrollment_status.active,
        progressPercent: 0,
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

    const courseId = lesson.chapters.course_id;

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
      },
      update: {
        is_completed: true,
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
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
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
    };
  }

  /**
   * 8. Giảng viên / Admin xem danh sách học viên và tiến độ học tập trong khóa học
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
        "You do not have permission to view students of this course",
      );
    }

    // Đếm tổng số bài học trong khóa học
    const totalLessons = await prisma.lessons.count({
      where: {
        chapters: { course_id: course.id },
      },
    });

    // Lấy toàn bộ danh sách ghi danh
    const enrollments = await prisma.enrollments.findMany({
      where: { course_id: course.id },
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
    });

    // Ghép dữ liệu tiến độ của từng học viên
    const students = await Promise.all(
      enrollments.map(async (en) => {
        const completedLessons = await prisma.lesson_progress.count({
          where: {
            user_id: en.user_id,
            is_completed: true,
            lessons: {
              chapters: { course_id: course.id },
            },
          },
        });

        const lastActivity = await prisma.lesson_progress.findFirst({
          where: {
            user_id: en.user_id,
            lessons: {
              chapters: { course_id: course.id },
            },
          },
          orderBy: { updated_at: "desc" },
          select: { updated_at: true },
        });

        const progressPercent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          enrollmentId: en.id,
          student: en.users,
          enrolledAt: en.enrolled_at,
          status: en.status,
          completedLessons,
          totalLessons,
          progressPercent,
          lastActivityAt: lastActivity?.updated_at || en.enrolled_at,
        };
      }),
    );

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      totalStudents: students.length,
      students,
    };
  }
}

export const enrollmentsService = new EnrollmentsService();
