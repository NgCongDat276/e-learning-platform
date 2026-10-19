import { Request, Response } from "express";
import { chaptersService } from "./chapters.service";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { user_role } from "@prisma/client";

export class ChaptersController {
  /**
   * [GET] /chapters/course/:courseId - Lấy danh sách chương của khóa học
   */
  async getChaptersByCourse(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const chapters = await chaptersService.getChaptersByCourse(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, chapters, "Chapters fetched successfully");
  }

  /**
   * [POST] /chapters - Tạo chương học mới
   */
  async createChapter(req: Request, res: Response): Promise<Response> {
    const chapter = await chaptersService.createChapter(
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendCreated(res, chapter, "Chapter created successfully");
  }

  /**
   * [PUT] /chapters/:id - Cập nhật tiêu đề chương học
   */
  async updateChapter(req: Request, res: Response): Promise<Response> {
    const chapterId = req.params.id as string;
    const updated = await chaptersService.updateChapter(
      chapterId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Chapter updated successfully");
  }

  /**
   * [PATCH] /chapters/reorder - Sắp xếp lại thứ tự danh sách chương
   */
  async reorderChapters(req: Request, res: Response): Promise<Response> {
    const updated = await chaptersService.reorderChapters(
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Chapters reordered successfully");
  }

  /**
   * [DELETE] /chapters/:id - Xóa chương học
   */
  async deleteChapter(req: Request, res: Response): Promise<Response> {
    const chapterId = req.params.id as string;
    await chaptersService.deleteChapter(
      chapterId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, null, "Chapter deleted successfully");
  }
}

export const chaptersController = new ChaptersController();
