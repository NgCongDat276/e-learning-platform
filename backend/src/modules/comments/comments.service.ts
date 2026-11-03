import prisma from "../../prisma";
import {
  user_role,
  enrollment_status,
  comment_status,
} from "@prisma/client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../common/errors/app-error";
import type {
  CreateCommentInput,
  UpdateCommentInput,
  GetLessonCommentsQuery,
} from "./comments.schema";

interface CommentUserRecord {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: user_role | null;
}

interface RawCommentRecord {
  id: string;
  lesson_id: string;
  parent_comment_id: string | null;
  content: string;
  status: comment_status | null;
  created_at: Date | null;
  updated_at: Date | null;
  users: CommentUserRecord;
  other_comments?: RawCommentRecord[];
}

export class CommentsService {
  /**
   * Helper: Kiểm tra bài học tồn tại và người dùng có quyền xem/bình luận
   * (Phải là học viên đã ghi danh khóa học, hoặc Giảng viên chủ khóa học, hoặc Admin)
   */
  private async verifyLessonAccess(
    lessonId: string,
    userId: string,
    userRole: user_role,
  ) {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        chapters: {
          select: {
            id: true,
            course_id: true,
            courses: {
              select: {
                id: true,
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

    const course = lesson.chapters.courses;
    const isAdmin = userRole === user_role.admin;
    const isCourseLecturer = course.lecturer_id === userId;

    if (!isAdmin && !isCourseLecturer) {
      if (course.status !== "published") {
        throw new NotFoundError("Lesson not found");
      }

      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: course.id,
          },
        },
        select: { status: true },
      });

      if (
        !enrollment ||
        (enrollment.status !== enrollment_status.active &&
          enrollment.status !== enrollment_status.completed)
      ) {
        throw new ForbiddenError(
          "You must enroll in this course to view and participate in lesson discussions",
        );
      }
    }

    return {
      lesson,
      courseId: course.id,
      courseLecturerId: course.lecturer_id,
    };
  }

  /**
   * Helper: Chuẩn hóa dữ liệu bình luận trả về cho Client
   */
  private formatComment(
    comment: RawCommentRecord,
    courseLecturerId: string,
  ) {
    return {
      id: comment.id,
      lesson_id: comment.lesson_id,
      parent_comment_id: comment.parent_comment_id,
      content: comment.content,
      status: comment.status,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: {
        id: comment.users.id,
        full_name: comment.users.full_name,
        avatar_url: comment.users.avatar_url,
        role: comment.users.role,
        is_course_lecturer: comment.users.id === courseLecturerId,
      },
      replies: (comment.other_comments || []).map((reply) => ({
        id: reply.id,
        lesson_id: reply.lesson_id,
        parent_comment_id: reply.parent_comment_id,
        content: reply.content,
        status: reply.status,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        user: {
          id: reply.users.id,
          full_name: reply.users.full_name,
          avatar_url: reply.users.avatar_url,
          role: reply.users.role,
          is_course_lecturer: reply.users.id === courseLecturerId,
        },
      })),
    };
  }

  /**
   * 1. Lấy danh sách bình luận của một bài học (Phân cấp 2 tầng: Root + Replies)
   */
  async getCommentsByLesson(
    lessonId: string,
    userId: string,
    userRole: user_role,
    query: GetLessonCommentsQuery,
  ) {
    const { courseLecturerId } = await this.verifyLessonAccess(
      lessonId,
      userId,
      userRole,
    );

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const rootWhereCondition = {
      lesson_id: lessonId,
      parent_comment_id: null,
      status: comment_status.approved,
    };

    const [rootComments, totalRootComments, totalAllComments] =
      await Promise.all([
        prisma.comments.findMany({
          where: rootWhereCondition,
          orderBy: { created_at: "desc" },
          skip,
          take: limit,
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
            other_comments: {
              where: { status: comment_status.approved },
              orderBy: { created_at: "asc" },
              include: {
                users: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                    role: true,
                  },
                },
              },
            },
          },
        }),
        prisma.comments.count({ where: rootWhereCondition }),
        prisma.comments.count({
          where: {
            lesson_id: lessonId,
            status: comment_status.approved,
          },
        }),
      ]);

    const items = rootComments.map((comment) =>
      this.formatComment(comment, courseLecturerId),
    );

    const totalPages = Math.ceil(totalRootComments / limit) || 1;

    return {
      items,
      total_comments: totalAllComments,
      course_lecturer_id: courseLecturerId,
      pagination: {
        page,
        limit,
        total: totalRootComments,
        totalPages,
      },
    };
  }

  /**
   * 2. Tạo bình luận mới hoặc trả lời bình luận trong bài học
   */
  async createComment(
    lessonId: string,
    userId: string,
    userRole: user_role,
    input: CreateCommentInput,
  ) {
    const { courseLecturerId } = await this.verifyLessonAccess(
      lessonId,
      userId,
      userRole,
    );

    let targetParentId: string | null = null;

    if (input.parent_comment_id) {
      const parentComment = await prisma.comments.findUnique({
        where: { id: input.parent_comment_id },
        select: {
          id: true,
          lesson_id: true,
          parent_comment_id: true,
          status: true,
        },
      });

      if (
        !parentComment ||
        parentComment.lesson_id !== lessonId ||
        parentComment.status !== comment_status.approved
      ) {
        throw new BadRequestError(
          "Parent comment does not exist in this lesson",
        );
      }

      // Quy tắc tối đa 2 cấp (2-level threading):
      // Nếu người dùng bấm trả lời vào 1 reply cấp 2, tự động quy về bình luận gốc cấp 1
      targetParentId = parentComment.parent_comment_id || parentComment.id;
    }

    const created = await prisma.comments.create({
      data: {
        lesson_id: lessonId,
        user_id: userId,
        parent_comment_id: targetParentId,
        content: input.content,
        status: comment_status.approved,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
          },
        },
        other_comments: {
          where: { status: comment_status.approved },
          orderBy: { created_at: "asc" },
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return this.formatComment(created, courseLecturerId);
  }

  /**
   * 3. Chỉnh sửa nội dung bình luận (Chỉ chính tác giả bình luận mới được sửa)
   */
  async updateComment(
    commentId: string,
    userId: string,
    input: UpdateCommentInput,
  ) {
    const existing = await prisma.comments.findUnique({
      where: { id: commentId },
      include: {
        lessons: {
          select: {
            chapters: {
              select: {
                courses: {
                  select: { lecturer_id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existing || existing.status !== comment_status.approved) {
      throw new NotFoundError("Comment not found");
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenError("You can only edit your own comments");
    }

    const courseLecturerId = existing.lessons.chapters.courses.lecturer_id;

    const updated = await prisma.comments.update({
      where: { id: commentId },
      data: {
        content: input.content,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
          },
        },
        other_comments: {
          where: { status: comment_status.approved },
          orderBy: { created_at: "asc" },
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return this.formatComment(updated, courseLecturerId);
  }

  /**
   * 4. Xóa bình luận (Tác giả bình luận, Giảng viên sở hữu khóa học, hoặc Admin)
   */
  async deleteComment(
    commentId: string,
    userId: string,
    userRole: user_role,
  ) {
    const existing = await prisma.comments.findUnique({
      where: { id: commentId },
      include: {
        lessons: {
          select: {
            chapters: {
              select: {
                courses: {
                  select: { lecturer_id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Comment not found");
    }

    const isCommentOwner = existing.user_id === userId;
    const isCourseLecturer =
      existing.lessons.chapters.courses.lecturer_id === userId;
    const isAdmin = userRole === user_role.admin;

    if (!isCommentOwner && !isCourseLecturer && !isAdmin) {
      throw new ForbiddenError(
        "You do not have permission to delete this comment",
      );
    }

    await prisma.comments.delete({
      where: { id: commentId },
    });

    return {
      deleted_id: commentId,
      parent_comment_id: existing.parent_comment_id,
    };
  }
}

export const commentsService = new CommentsService();

