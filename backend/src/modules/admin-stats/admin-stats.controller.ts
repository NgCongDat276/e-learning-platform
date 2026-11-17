import { Request, Response } from "express";
import { adminStatsService } from "./admin-stats.service";
import { sendSuccess } from "../../common/utils/api-response";
import { HttpStatus } from "../../common/errors/http-status";
import {
  CourseStatsQueryInput,
  LearningQualityQueryInput,
  LecturerStatsQueryInput,
  OverviewQueryInput,
} from "./admin-stats.schema";

export class AdminStatsController {
  // [GET] /admin/stats/overview - Tổng quan KPI + Biểu đồ xu hướng
  async getOverview(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as OverviewQueryInput;
    const data = await adminStatsService.getOverview(query);
    return sendSuccess(res, data, "Admin overview statistics fetched successfully");
  }

  // [GET] /admin/stats/courses - Thống kê khóa học (phân trang, tìm kiếm, sắp xếp)
  async getCourseStats(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as CourseStatsQueryInput;
    const result = await adminStatsService.getCourseStats(query);
    return sendSuccess(
      res,
      result.items,
      "Course statistics fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  // [GET] /admin/stats/lecturers - Thống kê giảng viên (phân trang, tìm kiếm, sắp xếp)
  async getLecturerStats(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as LecturerStatsQueryInput;
    const result = await adminStatsService.getLecturerStats(query);
    return sendSuccess(
      res,
      result.items,
      "Lecturer statistics fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  // [GET] /admin/stats/learning-quality - Thống kê chất lượng học tập & Quiz
  async getLearningQualityStats(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as LearningQualityQueryInput;
    const result = await adminStatsService.getLearningQualityStats(query);
    return sendSuccess(
      res,
      {
        summary: result.summary,
        quizzes: result.quizzes,
      },
      "Learning quality statistics fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }
}

export const adminStatsController = new AdminStatsController();
