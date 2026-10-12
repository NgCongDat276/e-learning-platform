import prisma from "../../prisma";
import { user_role } from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
} from "../../common/errors/app-error";
import type {
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from "./lessons.schema";

export class LessonsService {
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
        "You do not have permission to modify lessons in this course",
      );
    }

    return chapter;
  }

  /**
   * Helper kiểm tra quyền tác giả thông qua bài học
   */
  private async verifyLessonOwnership(
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
        "You do not have permission to modify this lesson",
      );
    }

    return lesson;
  }

  /**
   * 1. Tạo bài học mới trong một chương
   */
  async createLesson(
    userId: string,
    userRole: user_role,
    input: CreateLessonInput,
  ) {
    await this.verifyChapterOwnership(input.chapter_id, userId, userRole);

    let orderIndex = input.order_index;

    // Nếu không truyền order_index, tự động tính bằng max(order_index) + 1
    if (!orderIndex) {
      const lastLesson = await prisma.lessons.findFirst({
        where: { chapter_id: input.chapter_id },
        orderBy: { order_index: "desc" },
        select: { order_index: true },
      });

      orderIndex = lastLesson ? lastLesson.order_index + 1 : 1;
    }

    const newLesson = await prisma.lessons.create({
      data: {
        chapter_id: input.chapter_id,
        title: input.title,
        lesson_type: input.lesson_type,
        content_url: input.content_url || null,
        lesson_content: input.lesson_content || null,
        duration_seconds: input.duration_seconds || 0,
        order_index: orderIndex,
      },
    });

    return newLesson;
  }

  /**
   * 2. Lấy chi tiết bài học theo ID
   */
  async getLessonById(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            course_id: true,
            courses: {
              select: {
                id: true,
                title: true,
                lecturer_id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError("Lesson not found");
    }

    // Nếu bài học thuộc khóa học chưa xuất bản (draft/hidden), chỉ tác giả hoặc admin mới được xem
    if (lesson.chapters.courses.status !== "published") {
      const isAuthor = lesson.chapters.courses.lecturer_id === userId;
      const isAdmin = userRole === user_role.admin;
      if (!isAuthor && !isAdmin) {
        throw new NotFoundError("Lesson not found");
      }
    }

    return lesson;
  }

  /**
   * 3. Cập nhật bài học
   */
  async updateLesson(
    lessonId: string,
    userId: string,
    userRole: user_role,
    input: UpdateLessonInput,
  ) {
    await this.verifyLessonOwnership(lessonId, userId, userRole);

    const updatedLesson = await prisma.lessons.update({
      where: { id: lessonId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.lesson_type !== undefined && { lesson_type: input.lesson_type }),
        ...(input.content_url !== undefined && {
          content_url: input.content_url || null,
        }),
        ...(input.lesson_content !== undefined && {
          lesson_content: input.lesson_content || null,
        }),
        ...(input.duration_seconds !== undefined && {
          duration_seconds: input.duration_seconds || 0,
        }),
      },
    });

    return updatedLesson;
  }

  /**
   * 4. Sắp xếp lại thứ tự các bài học trong một chương
   */
  async reorderLessons(
    userId: string,
    userRole: user_role,
    input: ReorderLessonsInput,
  ) {
    await this.verifyChapterOwnership(input.chapter_id, userId, userRole);

    const { items, chapter_id } = input;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.lessons.update({
          where: { id: item.id },
          data: { order_index: item.order_index },
        });
      }
    });

    const updatedLessons = await prisma.lessons.findMany({
      where: { chapter_id },
      orderBy: { order_index: "asc" },
    });

    return updatedLessons;
  }

  /**
   * 5. Xóa bài học
   */
  async deleteLesson(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const lesson = await this.verifyLessonOwnership(
      lessonId,
      userId,
      userRole,
    );

    await prisma.lessons.delete({
      where: { id: lessonId },
    });

    // Tự động đánh lại số thứ tự cho các bài học còn lại trong chương
    const remainingLessons = await prisma.lessons.findMany({
      where: { chapter_id: lesson.chapter_id },
      orderBy: { order_index: "asc" },
      select: { id: true },
    });

    if (remainingLessons.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < remainingLessons.length; i++) {
          await tx.lessons.update({
            where: { id: remainingLessons[i].id },
            data: { order_index: i + 1 },
          });
        }
      });
    }

    return { success: true };
  }
}

export const lessonsService = new LessonsService();
