import { Request, Response } from "express";
import { user_role } from "@prisma/client";
import { commentsService } from "./comments.service";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { HttpStatus } from "../../common/errors/http-status";
import type { GetLessonCommentsQuery } from "./comments.schema";

export class CommentsController {
  /**
   * [GET] /comments/lessons/:lessonId - Lấy danh sách bình luận của bài học
   */
  async getLessonComments(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const query = req.query as unknown as GetLessonCommentsQuery;

    const result = await commentsService.getCommentsByLesson(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
      query,
    );

    return sendSuccess(
      res,
      {
        items: result.items,
        total_comments: result.total_comments,
        course_lecturer_id: result.course_lecturer_id,
      },
      "Lesson comments fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  /**
   * [POST] /comments/lessons/:lessonId - Tạo bình luận mới hoặc trả lời bình luận
   */
  async createComment(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;

    const comment = await commentsService.createComment(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );

    return sendCreated(res, comment, "Comment posted successfully");
  }

  /**
   * [PATCH] /comments/:commentId - Cập nhật nội dung bình luận
   */
  async updateComment(req: Request, res: Response): Promise<Response> {
    const commentId = req.params.commentId as string;

    const updated = await commentsService.updateComment(
      commentId,
      req.user!.id,
      req.body,
    );

    return sendSuccess(res, updated, "Comment updated successfully");
  }

  /**
   * [DELETE] /comments/:commentId - Xóa bình luận
   */
  async deleteComment(req: Request, res: Response): Promise<Response> {
    const commentId = req.params.commentId as string;

    const deleted = await commentsService.deleteComment(
      commentId,
      req.user!.id,
      req.user!.role as user_role,
    );

    return sendSuccess(res, deleted, "Comment deleted successfully");
  }
}

export const commentsController = new CommentsController();

