import { Request, Response } from "express";
import { enrollmentsService } from "./enrollments.service";
import { sendSuccess } from "../../common/utils/api-response";
import { user_role } from "@prisma/client";

export class EnrollmentsController {
  /**
   * [POST] /enrollments/courses/:courseId/enroll - Học viên ghi danh khóa học
   */
  async enroll(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const result = await enrollmentsService.enrollCourse(
      req.user!.id,
      courseId,
    );
    return sendSuccess(res, result, "Enrolled in course successfully", 201);
  }

  /**
   * [GET] /enrollments/courses/:courseId/status - Kiểm tra trạng thái ghi danh của học viên
   */
  async getStatus(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const result = await enrollmentsService.getEnrollmentStatus(
      req.user!.id,
      req.user!.role as user_role,
      courseId,
    );
    return sendSuccess(res, result, "Enrollment status retrieved successfully");
  }

  /**
   * [GET] /enrollments/my-courses - Danh sách khóa học học viên đã ghi danh
   */
  async getMyCourses(req: Request, res: Response): Promise<Response> {
    const result = await enrollmentsService.getMyEnrolledCourses(req.user!.id);
    return sendSuccess(res, result, "My courses retrieved successfully");
  }

  /**
   * [GET] /enrollments/courses/:courseId/classroom - Cây dữ liệu chương & bài học cho phòng học tập trung
   */
  async getClassroomData(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const result = await enrollmentsService.getClassroomCourseData(
      req.user!.id,
      req.user!.role as user_role,
      courseId,
    );
    return sendSuccess(res, result, "Classroom curriculum loaded successfully");
  }

  /**
   * [POST] /enrollments/lessons/:lessonId/complete - Đánh dấu bài học đã hoàn thành
   */
  async completeLesson(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const result = await enrollmentsService.completeLesson(
      req.user!.id,
      lessonId,
    );
    return sendSuccess(res, result, "Lesson marked as completed");
  }

  /**
   * [DELETE] /enrollments/lessons/:lessonId/complete - Hủy đánh dấu hoàn thành bài học
   */
  async uncompleteLesson(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const result = await enrollmentsService.uncompleteLesson(
      req.user!.id,
      lessonId,
    );
    return sendSuccess(res, result, "Lesson marked as incomplete");
  }

  /**
   * [PATCH] /enrollments/lessons/:lessonId/progress - Cập nhật vị trí xem video (giây)
   */
  async updateProgress(req: Request, res: Response): Promise<Response> {
    const lessonId = req.params.lessonId as string;
    const result = await enrollmentsService.updateLessonProgress(
      req.user!.id,
      lessonId,
      req.body.last_watched_position,
    );
    return sendSuccess(res, result, "Lesson progress updated successfully");
  }

  /**
   * [GET] /enrollments/courses/:courseId/students - Giảng viên xem danh sách học viên và tiến độ
   */
  async getCourseStudents(req: Request, res: Response): Promise<Response> {
    const courseId = req.params.courseId as string;
    const result = await enrollmentsService.getCourseStudents(
      req.user!.id,
      req.user!.role as user_role,
      courseId,
    );
    return sendSuccess(res, result, "Course students retrieved successfully");
  }
}

export const enrollmentsController = new EnrollmentsController();
