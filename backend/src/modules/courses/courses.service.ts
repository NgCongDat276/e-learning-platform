import prisma from "../../prisma";
import { Prisma, course_status, user_role } from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../common/errors/app-error";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseStatusInput,
  QueryCoursesInput,
} from "./courses.schema";
import { generateUniqueSlug } from "../../common/utils/slug.util";

export class CoursesService {
  /**
   * Helper nội bộ: Tự động sinh slug duy nhất cho bảng courses
   */
  private async generateCourseSlug(
    title: string,
    currentCourseId?: string,
  ): Promise<string> {
    return generateUniqueSlug(
      title,
      async (slug) => {
        const existing = await prisma.courses.findUnique({
          where: { slug },
          select: { id: true },
        });
        return (
          !!existing && (!currentCourseId || existing.id !== currentCourseId)
        );
      },
      "course",
    );
  }

  /**
   * 1. Tạo khóa học mới (Giảng viên / Admin)
   */
  async createCourse(lecturerId: string, data: CreateCourseInput) {
    // 1.1 Kiểm tra giảng viên có tồn tại và đang hoạt động không
    const lecturer = await prisma.users.findUnique({
      where: { id: lecturerId },
      select: { id: true, is_active: true, role: true },
    });

    if (!lecturer || !lecturer.is_active) {
      throw new ForbiddenError("Lecturer account is invalid or deactivated");
    }

    // 1.2 Sinh unique slug từ title
    const slug = await this.generateCourseSlug(data.title);

    // 1.3 Tạo bản ghi trong database (mặc định trạng thái là draft)
    const newCourse = await prisma.courses.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        thumbnail_url: data.thumbnail_url || null,
        price: data.price,
        level: data.level,
        status: course_status.draft,
        lecturer_id: lecturerId,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            teacher_profile: {
              select: {
                degree: true,
                expertise: true,
              },
            },
          },
        },
      },
    });

    return newCourse;
  }

  /**
   * 2. Cập nhật thông tin khóa học (Tác giả hoặc Admin)
   */
  async updateCourse(
    courseId: string,
    userId: string,
    userRole: user_role,
    data: UpdateCourseInput,
  ) {
    // 2.1 Kiểm tra khóa học tồn tại
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, lecturer_id: true, title: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // 2.2 Phân quyền: Chỉ tác giả hoặc Admin mới được phép chỉnh sửa
    if (userRole !== user_role.admin && course.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to modify this course",
      );
    }

    // 2.3 Chuẩn bị dữ liệu cập nhật
    const updateData: Prisma.coursesUpdateInput = {};

    if (data.title && data.title !== course.title) {
      updateData.title = data.title;
      updateData.slug = await this.generateCourseSlug(data.title, courseId);
    }

    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }

    if (data.thumbnail_url !== undefined) {
      updateData.thumbnail_url = data.thumbnail_url || null;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.level !== undefined) {
      updateData.level = data.level;
    }

    const updatedCourse = await prisma.courses.update({
      where: { id: courseId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return updatedCourse;
  }

  /**
   * 3. Thay đổi trạng thái xuất bản khóa học (DRAFT / PUBLISHED / HIDDEN)
   */
  async updateCourseStatus(
    courseId: string,
    userId: string,
    userRole: user_role,
    data: UpdateCourseStatusInput,
  ) {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, lecturer_id: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (userRole !== user_role.admin && course.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to change this course status",
      );
    }

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: { status: data.status },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updated_at: true,
      },
    });

    return updated;
  }

  /**
   * 4. Lấy danh sách khóa học công khai (Public Catalog)
   */
  async getCoursesList(query: QueryCoursesInput) {
    const {
      page = 1,
      limit = 10,
      search,
      level,
      status,
      lecturer_id,
      sort = "latest",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.coursesWhereInput = {};

    // Khách hoặc học viên chỉ xem các khóa đã PUBLISHED (trừ khi có query cụ thể từ admin)
    if (status) {
      where.status = status;
    } else {
      where.status = course_status.published;
    }

    if (level) {
      where.level = level;
    }

    if (lecturer_id) {
      where.lecturer_id = lecturer_id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Xác định tiêu chí sắp xếp
    let orderBy: Prisma.coursesOrderByWithRelationInput = {
      created_at: "desc",
    };

    switch (sort) {
      case "oldest":
        orderBy = { created_at: "asc" };
        break;
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "latest":
      default:
        orderBy = { created_at: "desc" };
        break;
    }

    const [total, courses] = await Promise.all([
      prisma.courses.count({ where }),
      prisma.courses.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail_url: true,
          price: true,
          level: true,
          status: true,
          created_at: true,
          updated_at: true,
          users: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
              teacher_profile: {
                select: {
                  degree: true,
                  expertise: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              chapters: true,
            },
          },
        },
      }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 5. Danh sách các khóa học của Giảng viên (Teaching Workspace)
   */
  async getMyTeachingCourses(lecturerId: string, query: QueryCoursesInput) {
    const {
      page = 1,
      limit = 10,
      search,
      level,
      status,
      sort = "latest",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.coursesWhereInput = {
      lecturer_id: lecturerId,
    };

    if (status) {
      where.status = status;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.coursesOrderByWithRelationInput = {
      created_at: "desc",
    };

    switch (sort) {
      case "oldest":
        orderBy = { created_at: "asc" };
        break;
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "latest":
      default:
        orderBy = { created_at: "desc" };
        break;
    }

    const [total, courses] = await Promise.all([
      prisma.courses.count({ where }),
      prisma.courses.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail_url: true,
          price: true,
          level: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              enrollments: true,
              chapters: true,
            },
          },
        },
      }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 6. Lấy chi tiết một khóa học theo slug (Kèm cây chương & bài học)
   */
  async getCourseBySlug(
    slug: string,
    userId?: string,
    userRole?: user_role,
  ) {
    const course = await prisma.courses.findUnique({
      where: { slug },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            email: true,
            teacher_profile: {
              select: {
                degree: true,
                expertise: true,
                bio: true,
              },
            },
          },
        },
        chapters: {
          orderBy: { order_index: "asc" },
          include: {
            lessons: {
              orderBy: { order_index: "asc" },
              select: {
                id: true,
                title: true,
                lesson_type: true,
                duration_seconds: true,
                order_index: true,
                created_at: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Nếu khóa học chưa PUBLISHED, chỉ có tác giả hoặc Admin mới được xem trước
    if (course.status !== course_status.published) {
      const isAuthor = userId && course.lecturer_id === userId;
      const isAdmin = userRole === user_role.admin;

      if (!isAuthor && !isAdmin) {
        throw new NotFoundError("Course not found");
      }
    }

    // Tính toán tổng số bài học và tổng thời lượng khóa học
    let totalLessons = 0;
    let totalDurationSeconds = 0;

    for (const chapter of course.chapters) {
      totalLessons += chapter.lessons.length;
      for (const lesson of chapter.lessons) {
        totalDurationSeconds += lesson.duration_seconds || 0;
      }
    }

    return {
      ...course,
      summary: {
        totalChapters: course.chapters.length,
        totalLessons,
        totalDurationSeconds,
      },
    };
  }

  /**
   * 7. Xóa khóa học (Chỉ tác giả hoặc Admin)
   */
  async deleteCourse(courseId: string, userId: string, userRole: user_role) {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, lecturer_id: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (userRole !== user_role.admin && course.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to delete this course",
      );
    }

    // Kiểm tra xem đã có học viên nào ghi danh chưa
    const enrolledCount = await prisma.enrollments.count({
      where: { course_id: courseId },
    });

    if (enrolledCount > 0) {
      throw new BadRequestError(
        "Cannot delete course with active enrollments. You can set status to 'hidden' instead.",
      );
    }

    await prisma.courses.delete({
      where: { id: courseId },
    });

    return { success: true };
  }
}

export const coursesService = new CoursesService();
