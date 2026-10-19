import { Request, Response } from "express";
import { lessonsService } from "./lessons.service";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { user_role } from "@prisma/client";

export class LessonsController {
  /**
   * [POST] /lessons - Tạo bài học mới trong chương
   */
  async createLesson(req: Request, res: Response): Promise<Response> {
    const lesson = await lessonsService.createLesson(
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendCreated(res, lesson, "Lesson created successfully");
  }

  /**
   * [GET] /lessons/:id - Xem chi tiết bài học
   */
  async getLessonById(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.id as string;
    const lesson = await lessonsService.getLessonById(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, lesson, "Lesson details fetched successfully");
  }

  /**
   * [PUT] /lessons/:id - Cập nhật thông tin bài học
   */
  async updateLesson(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.id as string;
    const updated = await lessonsService.updateLesson(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Lesson updated successfully");
  }

  /**
   * [PATCH] /lessons/reorder - Sắp xếp lại thứ tự bài học trong chương
   */
  async reorderLessons(req: Request, res: Response): Promise<Response> {
    const updated = await lessonsService.reorderLessons(
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Lessons reordered successfully");
  }

  /**
   * [DELETE] /lessons/:id - Xóa bài học
   */
  async deleteLesson(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.id as string;
    await lessonsService.deleteLesson(
      lessonId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, null, "Lesson deleted successfully");
  }
}

export const lessonsController = new LessonsController();
