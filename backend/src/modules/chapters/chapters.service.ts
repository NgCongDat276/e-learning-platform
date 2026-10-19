import prisma from "../../prisma";
import { user_role } from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../common/errors/app-error";
import type {
  CreateChapterInput,
  UpdateChapterInput,
  ReorderChaptersInput,
} from "./chapters.schema";

export class ChaptersService {
  /**
   * Helper kiểm tra quyền tác giả khóa học (hoặc Admin)
   */
  private async verifyCourseOwnership(
    courseIdOrSlug: string,
    userId: string,
    userRole: user_role,
  ) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        courseIdOrSlug,
      );

    const course = await prisma.courses.findFirst({
      where: isUuid
        ? { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] }
        : { slug: courseIdOrSlug },
      select: { id: true, lecturer_id: true, title: true, status: true },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (userRole !== user_role.admin && course.lecturer_id !== userId) {
      throw new ForbiddenError(
        "You do not have permission to modify this course curriculum",
      );
    }

    return course;
  }

  /**
   * Helper kiểm tra quyền tác giả thông qua chương học
   */
  private async verifyChapterOwnership(
    chapterId: string,
    userId: string,
    userRole: user_role,
  ) {
    const chapter = await prisma.chapters.findUnique({
      where: { id: chapterId },
      include: {
        courses: {
          select: { id: true, lecturer_id: true },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    if (
      userRole !== user_role.admin &&
      chapter.courses.lecturer_id !== userId
    ) {
      throw new ForbiddenError(
        "You do not have permission to modify this chapter",
      );
    }

    return chapter;
  }

  /**
   * 1. Lấy toàn bộ danh sách chương và bài học của một khóa học (Dành cho Course Builder)
   */
  async getChaptersByCourse(
    courseId: string,
    userId: string,
    userRole: user_role,
  ) {
    const course = await this.verifyCourseOwnership(courseId, userId, userRole);

    const chapters = await prisma.chapters.findMany({
      where: { course_id: course.id },
      orderBy: { order_index: "asc" },
      include: {
        lessons: {
          orderBy: { order_index: "asc" },
          select: {
            id: true,
            chapter_id: true,
            title: true,
            lesson_type: true,
            content_url: true,
            lesson_content: true,
            duration_seconds: true,
            order_index: true,
            created_at: true,
          },
        },
      },
    });

    return chapters;
  }

  /**
   * 2. Tạo chương học mới
   */
  async createChapter(
    userId: string,
    userRole: user_role,
    input: CreateChapterInput,
  ) {
    const course = await this.verifyCourseOwnership(
      input.course_id,
      userId,
      userRole,
    );

    let orderIndex = input.order_index;

    // Nếu không truyền order_index, tự động tính bằng max(order_index) + 1
    if (!orderIndex) {
      const lastChapter = await prisma.chapters.findFirst({
        where: { course_id: course.id },
        orderBy: { order_index: "desc" },
        select: { order_index: true },
      });

      orderIndex = lastChapter ? lastChapter.order_index + 1 : 1;
    } else {
      // Kiểm tra xem order_index có bị trùng không
      const existing = await prisma.chapters.findUnique({
        where: {
          course_id_order_index: {
            course_id: course.id,
            order_index: orderIndex,
          },
        },
      });

      if (existing) {
        throw new BadRequestError(
          `A chapter with order index ${orderIndex} already exists in this course`,
        );
      }
    }

    const newChapter = await prisma.chapters.create({
      data: {
        course_id: course.id,
        title: input.title,
        order_index: orderIndex,
      },
      include: {
        lessons: true,
      },
    });

    return newChapter;
  }

  /**
   * 3. Cập nhật tiêu đề chương học
   */
  async updateChapter(
    chapterId: string,
    userId: string,
    userRole: user_role,
    input: UpdateChapterInput,
  ) {
    await this.verifyChapterOwnership(chapterId, userId, userRole);

    const updatedChapter = await prisma.chapters.update({
      where: { id: chapterId },
      data: {
        title: input.title,
      },
      include: {
        lessons: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return updatedChapter;
  }

  /**
   * 4. Sắp xếp lại thứ tự danh sách các chương học trong khóa học
   */
  async reorderChapters(
    userId: string,
    userRole: user_role,
    input: ReorderChaptersInput,
  ) {
    const course = await this.verifyCourseOwnership(
      input.course_id,
      userId,
      userRole,
    );

    const { items } = input;

    // Sử dụng transaction:
    // Bước 1: Gán order_index âm tạm thời để tránh vi phạm unique constraint [course_id, order_index]
    // Bước 2: Gán order_index mới
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < items.length; i++) {
        await tx.chapters.update({
          where: { id: items[i].id },
          data: { order_index: -(i + 1) },
        });
      }

      for (let i = 0; i < items.length; i++) {
        await tx.chapters.update({
          where: { id: items[i].id },
          data: { order_index: items[i].order_index },
        });
      }
    });

    // Trả về danh sách đã sắp xếp lại
    const updatedChapters = await prisma.chapters.findMany({
      where: { course_id: course.id },
      orderBy: { order_index: "asc" },
      include: {
        lessons: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return updatedChapters;
  }

  /**
   * 5. Xóa chương học
   */
  async deleteChapter(
    chapterId: string,
    userId: string,
    userRole: user_role,
  ) {
    const chapter = await this.verifyChapterOwnership(
      chapterId,
      userId,
      userRole,
    );

    await prisma.chapters.delete({
      where: { id: chapterId },
    });

    // Tự động sắp xếp lại thứ tự các chương còn lại để không có lỗ hổng số thứ tự
    const remainingChapters = await prisma.chapters.findMany({
      where: { course_id: chapter.course_id },
      orderBy: { order_index: "asc" },
      select: { id: true },
    });

    if (remainingChapters.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < remainingChapters.length; i++) {
          await tx.chapters.update({
            where: { id: remainingChapters[i].id },
            data: { order_index: -(i + 1) },
          });
        }

        for (let i = 0; i < remainingChapters.length; i++) {
          await tx.chapters.update({
            where: { id: remainingChapters[i].id },
            data: { order_index: i + 1 },
          });
        }
      });
    }

    return { success: true };
  }
}

export const chaptersService = new ChaptersService();
