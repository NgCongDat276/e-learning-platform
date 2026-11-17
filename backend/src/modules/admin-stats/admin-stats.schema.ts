import { z } from "zod";
import { course_level, course_status } from "@prisma/client";

const MAX_RANGE_DAYS = 730;

const baseTimeRangeObject = z.object({
  fromTime: z.coerce.date().optional(),
  toTime: z.coerce.date().optional(),
});

function validateTimeRange(
  data: { fromTime?: Date; toTime?: Date },
  ctx: z.RefinementCtx,
) {
  if (data.fromTime && data.toTime) {
    if (data.fromTime > data.toTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fromTime"],
        message: "fromTime must be less than or equal to toTime",
      });
    }

    const diffDays =
      (data.toTime.getTime() - data.fromTime.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toTime"],
        message: `Time range must not exceed ${MAX_RANGE_DAYS} days`,
      });
    }
  }
}

const paginationObject = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const overviewQuerySchema = baseTimeRangeObject.superRefine(validateTimeRange);

export const courseStatsQuerySchema = baseTimeRangeObject
  .merge(paginationObject)
  .extend({
    status: z.nativeEnum(course_status).optional(),
    level: z.nativeEnum(course_level).optional(),
    sortBy: z
      .enum([
        "enrollmentsInPeriod",
        "totalEnrollments",
        "estimatedRevenue",
        "completionRate",
        "commentsCount",
        "price",
        "createdAt",
      ])
      .default("enrollmentsInPeriod"),
  })
  .superRefine(validateTimeRange);

export const lecturerStatsQuerySchema = baseTimeRangeObject
  .merge(paginationObject)
  .extend({
    sortBy: z
      .enum([
        "enrollmentsInPeriod",
        "totalStudents",
        "publishedCourses",
        "estimatedRevenue",
        "completionRate",
      ])
      .default("enrollmentsInPeriod"),
  })
  .superRefine(validateTimeRange);

export const learningQualityQuerySchema = baseTimeRangeObject
  .merge(paginationObject)
  .extend({
    sortBy: z
      .enum(["attemptsInPeriod", "passRate", "averageScore"])
      .default("attemptsInPeriod"),
  })
  .superRefine(validateTimeRange);

export type OverviewQueryInput = z.infer<typeof overviewQuerySchema>;
export type CourseStatsQueryInput = z.infer<typeof courseStatsQuerySchema>;
export type LecturerStatsQueryInput = z.infer<typeof lecturerStatsQuerySchema>;
export type LearningQualityQueryInput = z.infer<typeof learningQualityQuerySchema>;
