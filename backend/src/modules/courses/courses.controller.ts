import { Request, Response } from "express";
import { coursesService } from "./courses.service";
import { sendCreated, sendSuccess } from "../../common/utils/api-response";
import { HttpStatus } from "../../common/errors/http-status";
import { user_role } from "@prisma/client";
import type { QueryCoursesInput } from "./courses.schema";

export class CoursesController {
  // [POST] /courses - Tạo khóa học mới (Giảng viên / Admin)
  async createCourse(req: Request, res: Response): Promise<Response> {
    const course = await coursesService.createCourse(req.user!.id, req.body);
    return sendCreated(res, course, "Course created successfully");
  }

  // [PUT] /courses/:id - Cập nhật thông tin khóa học (Tác giả / Admin)
  async updateCourse(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.id as string;
    const updated = await coursesService.updateCourse(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Course updated successfully");
  }

  // [PATCH] /courses/:id/status - Đổi trạng thái hiển thị khóa học (Tác giả / Admin)
  async updateCourseStatus(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.id as string;
    const updated = await coursesService.updateCourseStatus(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
      req.body,
    );
    return sendSuccess(res, updated, "Course status updated successfully");
  }

  // [GET] /courses - Danh sách khóa học công khai cho học viên (Public Catalog)
  async getCoursesList(req: Request, res: Response): Promise<Response> {
    const result = await coursesService.getCoursesList(
      req.query as unknown as QueryCoursesInput,
    );
    return sendSuccess(
      res,
      result.courses,
      "Courses fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  // [GET] /courses/teaching/me - Danh sách khóa học của Giảng viên (Teaching Workspace)
  async getMyTeachingCourses(req: Request, res: Response): Promise<Response> {
    const result = await coursesService.getMyTeachingCourses(
      req.user!.id,
      req.query as unknown as QueryCoursesInput,
    );
    return sendSuccess(
      res,
      result.courses,
      "Teaching courses fetched successfully",
      HttpStatus.OK,
      result.pagination,
    );
  }

  // [GET] /courses/:slug - Chi tiết khóa học theo slug (Public / Author preview)
  async getCourseBySlug(req: Request, res: Response): Promise<Response> {
    const slug = req.params.slug as string;
    const course = await coursesService.getCourseBySlug(
      slug,
      req.user?.id,
      req.user?.role as user_role | undefined,
    );
    return sendSuccess(res, course, "Course details fetched successfully");
  }

  // [DELETE] /courses/:id - Xóa khóa học (Tác giả / Admin)
  async deleteCourse(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.id as string;
    await coursesService.deleteCourse(
      courseId,
      req.user!.id,
      req.user!.role as user_role,
    );
    return sendSuccess(res, null, "Course deleted successfully");
  }
}

export const coursesController = new CoursesController();
