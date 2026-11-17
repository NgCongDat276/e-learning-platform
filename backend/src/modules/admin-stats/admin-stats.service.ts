import {
  Prisma,
  comment_status,
  course_level,
  course_status,
  enrollment_status,
  lecturer_request_status,
  lesson_type,
  user_role,
} from "@prisma/client";
import prisma from "../../prisma";
import { BadRequestError } from "../../common/errors/app-error";
import { PaginationMeta } from "../../common/utils/api-response";
import {
  CourseStatsQueryInput,
  LearningQualityQueryInput,
  LecturerStatsQueryInput,
  OverviewQueryInput,
} from "./admin-stats.schema";

type Granularity = "hour" | "day" | "week" | "month";

const DEFAULT_RANGE_MS = 30 * 24 * 60 * 60 * 1000;
const REPORT_TIMEZONE = "Asia/Ho_Chi_Minh";

const GRANULARITY_SQL: Record<Granularity, { trunc: string; step: string }> = {
  hour: { trunc: "hour", step: "1 hour" },
  day: { trunc: "day", step: "1 day" },
  week: { trunc: "week", step: "1 week" },
  month: { trunc: "month", step: "1 month" },
};

const COURSE_SORT_COLUMNS: Record<CourseStatsQueryInput["sortBy"], string> = {
  enrollmentsInPeriod: "enrollments_in_period",
  totalEnrollments: "total_enrollments",
  estimatedRevenue: "estimated_revenue",
  completionRate: "completion_rate",
  commentsCount: "comments_count",
  price: "price",
  createdAt: "created_at",
};

const LECTURER_SORT_COLUMNS: Record<LecturerStatsQueryInput["sortBy"], string> =
  {
    enrollmentsInPeriod: "enrollments_in_period",
    totalStudents: "total_students",
    publishedCourses: "published_courses",
    estimatedRevenue: "estimated_revenue",
    completionRate: "completion_rate",
  };

const QUIZ_SORT_COLUMNS: Record<LearningQualityQueryInput["sortBy"], string> =
  {
    attemptsInPeriod: "attempts_in_period",
    passRate: "pass_rate",
    averageScore: "average_score",
  };

function resolveTimeRange(query: { fromTime?: Date; toTime?: Date }) {
  const toTime = query.toTime ?? new Date();
  const fromTime =
    query.fromTime ?? new Date(toTime.getTime() - DEFAULT_RANGE_MS);

  if (fromTime > toTime) {
    throw new BadRequestError("fromTime must be less than or equal to toTime");
  }

  const durationMs = Math.max(toTime.getTime() - fromTime.getTime(), 1000);
  const previousToTime = new Date(fromTime.getTime());
  const previousFromTime = new Date(fromTime.getTime() - durationMs);

  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  let granularity: Granularity = "day";
  if (durationDays <= 2) {
    granularity = "hour";
  } else if (durationDays <= 60) {
    granularity = "day";
  } else if (durationDays <= 270) {
    granularity = "week";
  } else {
    granularity = "month";
  }

  return {
    fromTime,
    toTime,
    previousFromTime,
    previousToTime,
    granularity,
  };
}

function calcGrowthPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function formatBucketLabel(bucket: Date, granularity: Granularity): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(bucket);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  if (granularity === "hour") {
    return `${map.hour}:00 ${map.day}/${map.month}`;
  }
  if (granularity === "month") {
    return `${map.month}/${map.year}`;
  }
  return `${map.day}/${map.month}`;
}

export class AdminStatsService {
  /**
   * 1. [GET] /admin/stats/overview
   * KPI cards + Time-series trend + Pending actions
   */
  async getOverview(query: OverviewQueryInput) {
    const {
      fromTime,
      toTime,
      previousFromTime,
      previousToTime,
      granularity,
    } = resolveTimeRange(query);

    const { trunc, step } = GRANULARITY_SQL[granularity];
    const truncRaw = Prisma.raw(`'${trunc}'`);
    const stepRaw = Prisma.raw(`'${step}'::interval`);
    const tzRaw = Prisma.raw(`'${REPORT_TIMEZONE}'`);

    const [
      userRoleGroups,
      newUsersInPeriod,
      prevNewUsersInPeriod,
      courseStatusGroups,
      courseLevelGroups,
      newCoursesInPeriod,
      enrollmentStatusGroups,
      enrollmentsInPeriod,
      prevEnrollmentsInPeriod,
      revenueCurrentRows,
      revenuePrevRows,
      pendingLecturerRequestsCount,
      pendingCommentsCount,
      trendRows,
      recentPendingRequests,
    ] = await Promise.all([
      prisma.users.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
      prisma.users.count({
        where: { created_at: { gte: fromTime, lte: toTime } },
      }),
      prisma.users.count({
        where: { created_at: { gte: previousFromTime, lt: previousToTime } },
      }),
      prisma.courses.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.courses.groupBy({
        by: ["level"],
        _count: { _all: true },
      }),
      prisma.courses.count({
        where: { created_at: { gte: fromTime, lte: toTime } },
      }),
      prisma.enrollments.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.enrollments.count({
        where: {
          enrolled_at: { gte: fromTime, lte: toTime },
          status: { not: enrollment_status.cancelled },
        },
      }),
      prisma.enrollments.count({
        where: {
          enrolled_at: { gte: previousFromTime, lt: previousToTime },
          status: { not: enrollment_status.cancelled },
        },
      }),
      prisma.$queryRaw<Array<{ total_revenue: number; paid_count: number }>>`
        SELECT
          COALESCE(SUM(COALESCE(c.price, 0)), 0)::float8 AS total_revenue,
          COUNT(*) FILTER (WHERE COALESCE(c.price, 0) > 0)::int AS paid_count
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.enrolled_at >= ${fromTime}
          AND e.enrolled_at <= ${toTime}
          AND e.status != 'cancelled'
      `,
      prisma.$queryRaw<Array<{ total_revenue: number }>>`
        SELECT
          COALESCE(SUM(COALESCE(c.price, 0)), 0)::float8 AS total_revenue
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.enrolled_at >= ${previousFromTime}
          AND e.enrolled_at < ${previousToTime}
          AND e.status != 'cancelled'
      `,
      prisma.lecturer_requests.count({
        where: { status: lecturer_request_status.pending },
      }),
      prisma.comments.count({
        where: { status: comment_status.pending },
      }),
      prisma.$queryRaw<
        Array<{
          bucket_utc: Date;
          new_users: number;
          new_enrollments: number;
          estimated_revenue: number;
        }>
      >`
        WITH series AS (
          SELECT generate_series(
            DATE_TRUNC(${truncRaw}, ${fromTime}::timestamptz AT TIME ZONE ${tzRaw}),
            DATE_TRUNC(${truncRaw}, ${toTime}::timestamptz AT TIME ZONE ${tzRaw}),
            ${stepRaw}
          ) AS bucket_local
        ),
        user_agg AS (
          SELECT
            DATE_TRUNC(${truncRaw}, created_at AT TIME ZONE ${tzRaw}) AS bucket_local,
            COUNT(*)::int AS cnt
          FROM users
          WHERE created_at >= ${fromTime} AND created_at <= ${toTime}
          GROUP BY 1
        ),
        enroll_agg AS (
          SELECT
            DATE_TRUNC(${truncRaw}, e.enrolled_at AT TIME ZONE ${tzRaw}) AS bucket_local,
            COUNT(*)::int AS cnt,
            COALESCE(SUM(COALESCE(c.price, 0)), 0)::float8 AS rev
          FROM enrollments e
          JOIN courses c ON c.id = e.course_id
          WHERE e.enrolled_at >= ${fromTime}
            AND e.enrolled_at <= ${toTime}
            AND e.status != 'cancelled'
          GROUP BY 1
        )
        SELECT
          (s.bucket_local AT TIME ZONE ${tzRaw}) AS bucket_utc,
          COALESCE(u.cnt, 0)::int AS new_users,
          COALESCE(en.cnt, 0)::int AS new_enrollments,
          COALESCE(en.rev, 0)::float8 AS estimated_revenue
        FROM series s
        LEFT JOIN user_agg u ON u.bucket_local = s.bucket_local
        LEFT JOIN enroll_agg en ON en.bucket_local = s.bucket_local
        ORDER BY s.bucket_local ASC
      `,
      prisma.lecturer_requests.findMany({
        where: { status: lecturer_request_status.pending },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          user_id: true,
          note: true,
          created_at: true,
          users_lecturer_requests_user_idTousers: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const byRole = { student: 0, lecturer: 0, admin: 0 };
    let totalUsers = 0;
    for (const g of userRoleGroups) {
      totalUsers += g._count._all;
      if (g.role === user_role.student) byRole.student = g._count._all;
      else if (g.role === user_role.lecturer) byRole.lecturer = g._count._all;
      else if (g.role === user_role.admin) byRole.admin = g._count._all;
    }

    const byStatus = { published: 0, draft: 0, hidden: 0 };
    let totalCourses = 0;
    for (const g of courseStatusGroups) {
      totalCourses += g._count._all;
      if (g.status === course_status.published) byStatus.published = g._count._all;
      else if (g.status === course_status.draft) byStatus.draft = g._count._all;
      else if (g.status === course_status.hidden) byStatus.hidden = g._count._all;
    }

    const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const g of courseLevelGroups) {
      if (g.level === course_level.beginner) byLevel.beginner = g._count._all;
      else if (g.level === course_level.intermediate)
        byLevel.intermediate = g._count._all;
      else if (g.level === course_level.advanced) byLevel.advanced = g._count._all;
    }

    let activeAllTime = 0;
    let completedAllTime = 0;
    let cancelledAllTime = 0;
    for (const g of enrollmentStatusGroups) {
      if (g.status === enrollment_status.active) activeAllTime = g._count._all;
      else if (g.status === enrollment_status.completed)
        completedAllTime = g._count._all;
      else if (g.status === enrollment_status.cancelled)
        cancelledAllTime = g._count._all;
    }
    const validAllTime = activeAllTime + completedAllTime;
    const enrollmentCompletionRate =
      validAllTime > 0
        ? Number(((completedAllTime / validAllTime) * 100).toFixed(1))
        : 0;

    const revCurr = revenueCurrentRows[0]?.total_revenue ?? 0;
    const paidCount = revenueCurrentRows[0]?.paid_count ?? 0;
    const revPrev = revenuePrevRows[0]?.total_revenue ?? 0;

    return {
      range: {
        fromTime: fromTime.toISOString(),
        toTime: toTime.toISOString(),
        previousFromTime: previousFromTime.toISOString(),
        previousToTime: previousToTime.toISOString(),
        granularity,
      },
      kpis: {
        users: {
          total: totalUsers,
          newInPeriod: newUsersInPeriod,
          prevNewInPeriod: prevNewUsersInPeriod,
          growthPercent: calcGrowthPercent(newUsersInPeriod, prevNewUsersInPeriod),
          byRole,
        },
        courses: {
          total: totalCourses,
          newInPeriod: newCoursesInPeriod,
          byStatus,
          byLevel,
        },
        enrollments: {
          totalInPeriod: enrollmentsInPeriod,
          prevTotalInPeriod: prevEnrollmentsInPeriod,
          growthPercent: calcGrowthPercent(
            enrollmentsInPeriod,
            prevEnrollmentsInPeriod,
          ),
          totalAllTime: validAllTime,
          completedAllTime,
          cancelledAllTime,
          completionRate: enrollmentCompletionRate,
        },
        estimatedRevenue: {
          inPeriod: revCurr,
          prevInPeriod: revPrev,
          growthPercent: calcGrowthPercent(revCurr, revPrev),
          paidEnrollmentsInPeriod: paidCount,
        },
        pendingActions: {
          lecturerRequests: pendingLecturerRequestsCount,
          comments: pendingCommentsCount,
          total: pendingLecturerRequestsCount + pendingCommentsCount,
        },
      },
      trend: trendRows.map((row) => ({
        bucket: row.bucket_utc.toISOString(),
        label: formatBucketLabel(row.bucket_utc, granularity),
        newUsers: row.new_users,
        newEnrollments: row.new_enrollments,
        estimatedRevenue: row.estimated_revenue,
      })),
      recentPendingRequests: recentPendingRequests.map((r) => ({
        id: r.id,
        userId: r.user_id,
        fullName: r.users_lecturer_requests_user_idTousers.full_name,
        email: r.users_lecturer_requests_user_idTousers.email,
        note: r.note,
        createdAt: r.created_at,
      })),
    };
  }

  /**
   * 2. [GET] /admin/stats/courses
   * Thống kê khóa học có phân trang, tìm kiếm, lọc và sắp xếp
   */
  async getCourseStats(query: CourseStatsQueryInput) {
    const { fromTime, toTime } = resolveTimeRange(query);
    const { page, limit, search, status, level, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const searchPattern = search ? `%${search}%` : null;
    const whereClause: Prisma.coursesWhereInput = {
      ...(status && { status }),
      ...(level && { level }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { users: { full_name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const sqlConditions: Prisma.Sql[] = [];
    if (status) {
      sqlConditions.push(Prisma.sql`c.status = ${status}::course_status`);
    }
    if (level) {
      sqlConditions.push(Prisma.sql`c.level = ${level}::course_level`);
    }
    if (searchPattern) {
      sqlConditions.push(
        Prisma.sql`(c.title ILIKE ${searchPattern} OR u.full_name ILIKE ${searchPattern})`,
      );
    }

    const whereSql =
      sqlConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, " AND ")}`
        : Prisma.empty;

    const orderCol = Prisma.raw(COURSE_SORT_COLUMNS[sortBy]);
    const orderDir = Prisma.raw(sortOrder === "asc" ? "ASC" : "DESC");

    const [total, rows] = await Promise.all([
      prisma.courses.count({ where: whereClause }),
      prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          slug: string;
          status: course_status | null;
          level: course_level | null;
          price: number;
          created_at: Date | null;
          lecturer_id: string;
          lecturer_name: string;
          enrollments_in_period: number;
          total_enrollments: number;
          completed_enrollments: number;
          estimated_revenue: number;
          completion_rate: number;
          comments_count: number;
        }>
      >`
        WITH course_agg AS (
          SELECT
            c.id,
            c.title,
            c.slug,
            c.status,
            c.level,
            COALESCE(c.price, 0)::float8 AS price,
            c.created_at,
            c.lecturer_id,
            u.full_name AS lecturer_name,
            COUNT(e.id) FILTER (
              WHERE e.enrolled_at >= ${fromTime}
                AND e.enrolled_at <= ${toTime}
                AND e.status != 'cancelled'
            )::int AS enrollments_in_period,
            COUNT(e.id) FILTER (WHERE e.status != 'cancelled')::int AS total_enrollments,
            COUNT(e.id) FILTER (WHERE e.status = 'completed')::int AS completed_enrollments,
            (
              COUNT(e.id) FILTER (
                WHERE e.enrolled_at >= ${fromTime}
                  AND e.enrolled_at <= ${toTime}
                  AND e.status != 'cancelled'
              ) * COALESCE(c.price, 0)
            )::float8 AS estimated_revenue,
            CASE
              WHEN COUNT(e.id) FILTER (WHERE e.status != 'cancelled') > 0
              THEN ROUND(
                (COUNT(e.id) FILTER (WHERE e.status = 'completed')::numeric
                  / COUNT(e.id) FILTER (WHERE e.status != 'cancelled')) * 100,
                1
              )::float8
              ELSE 0::float8
            END AS completion_rate,
            (
              SELECT COUNT(*)::int
              FROM comments cm
              JOIN lessons l ON l.id = cm.lesson_id
              JOIN chapters ch ON ch.id = l.chapter_id
              WHERE ch.course_id = c.id
            ) AS comments_count
          FROM courses c
          JOIN users u ON u.id = c.lecturer_id
          LEFT JOIN enrollments e ON e.course_id = c.id
          ${whereSql}
          GROUP BY c.id, u.full_name
        )
        SELECT *
        FROM course_agg
        ORDER BY ${orderCol} ${orderDir}, total_enrollments DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status,
        level: r.level,
        price: r.price,
        createdAt: r.created_at,
        lecturerId: r.lecturer_id,
        lecturerName: r.lecturer_name,
        enrollmentsInPeriod: r.enrollments_in_period,
        totalEnrollments: r.total_enrollments,
        completedEnrollments: r.completed_enrollments,
        estimatedRevenue: r.estimated_revenue,
        completionRate: r.completion_rate,
        commentsCount: r.comments_count,
      })),
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * 3. [GET] /admin/stats/lecturers
   * Thống kê giảng viên có phân trang, tìm kiếm và sắp xếp
   */
  async getLecturerStats(query: LecturerStatsQueryInput) {
    const { fromTime, toTime } = resolveTimeRange(query);
    const { page, limit, search, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const searchPattern = search ? `%${search}%` : null;
    const whereClause: Prisma.usersWhereInput = {
      role: user_role.lecturer,
      ...(search && {
        OR: [
          { full_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          {
            teacher_profile: {
              expertise: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const searchSql = searchPattern
      ? Prisma.sql`AND (u.full_name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern} OR tp.expertise ILIKE ${searchPattern})`
      : Prisma.empty;

    const orderCol = Prisma.raw(LECTURER_SORT_COLUMNS[sortBy]);
    const orderDir = Prisma.raw(sortOrder === "asc" ? "ASC" : "DESC");

    const [total, rows] = await Promise.all([
      prisma.users.count({ where: whereClause }),
      prisma.$queryRaw<
        Array<{
          id: string;
          full_name: string;
          email: string;
          expertise: string | null;
          total_courses: number;
          published_courses: number;
          enrollments_in_period: number;
          total_students: number;
          estimated_revenue: number;
          completion_rate: number;
        }>
      >`
        WITH lecturer_agg AS (
          SELECT
            u.id,
            u.full_name,
            u.email,
            tp.expertise,
            COUNT(DISTINCT c.id)::int AS total_courses,
            COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published')::int AS published_courses,
            COUNT(e.id) FILTER (
              WHERE e.enrolled_at >= ${fromTime}
                AND e.enrolled_at <= ${toTime}
                AND e.status != 'cancelled'
            )::int AS enrollments_in_period,
            COUNT(e.id) FILTER (WHERE e.status != 'cancelled')::int AS total_students,
            COALESCE(
              SUM(COALESCE(c.price, 0)) FILTER (
                WHERE e.enrolled_at >= ${fromTime}
                  AND e.enrolled_at <= ${toTime}
                  AND e.status != 'cancelled'
              ),
              0
            )::float8 AS estimated_revenue,
            CASE
              WHEN COUNT(e.id) FILTER (WHERE e.status != 'cancelled') > 0
              THEN ROUND(
                (COUNT(e.id) FILTER (WHERE e.status = 'completed')::numeric
                  / COUNT(e.id) FILTER (WHERE e.status != 'cancelled')) * 100,
                1
              )::float8
              ELSE 0::float8
            END AS completion_rate
          FROM users u
          LEFT JOIN teacher_profile tp ON tp.user_id = u.id
          LEFT JOIN courses c ON c.lecturer_id = u.id
          LEFT JOIN enrollments e ON e.course_id = c.id
          WHERE u.role = 'lecturer'
          ${searchSql}
          GROUP BY u.id, u.full_name, u.email, tp.expertise
        )
        SELECT *
        FROM lecturer_agg
        ORDER BY ${orderCol} ${orderDir}, total_students DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        email: r.email,
        expertise: r.expertise,
        totalCourses: r.total_courses,
        publishedCourses: r.published_courses,
        enrollmentsInPeriod: r.enrollments_in_period,
        totalStudents: r.total_students,
        estimatedRevenue: r.estimated_revenue,
        completionRate: r.completion_rate,
      })),
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * 4. [GET] /admin/stats/learning-quality
   * Thống kê chất lượng Quiz & Tiến độ bài học (có phân trang danh sách Quiz)
   */
  async getLearningQualityStats(query: LearningQualityQueryInput) {
    const { fromTime, toTime } = resolveTimeRange(query);
    const { page, limit, search, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const searchPattern = search ? `%${search}%` : null;
    const quizWhereClause: Prisma.quizzesWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { lessons: { title: { contains: search, mode: "insensitive" } } },
            {
              lessons: {
                chapters: {
                  courses: {
                    title: { contains: search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {};

    const searchSql = searchPattern
      ? Prisma.sql`WHERE (COALESCE(q.title, '') ILIKE ${searchPattern} OR l.title ILIKE ${searchPattern} OR c.title ILIKE ${searchPattern})`
      : Prisma.empty;

    const orderCol = Prisma.raw(QUIZ_SORT_COLUMNS[sortBy]);
    const orderDir = Prisma.raw(sortOrder === "asc" ? "ASC" : "DESC");

    const [
      quizSummaryRows,
      lessonProgressByTypeRows,
      totalQuizzes,
      quizRows,
    ] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          total_attempts: number;
          passed_attempts: number;
          avg_score: number;
        }>
      >`
        SELECT
          COUNT(*)::int AS total_attempts,
          COUNT(*) FILTER (WHERE is_passed = true)::int AS passed_attempts,
          COALESCE(AVG(score), 0)::float8 AS avg_score
        FROM quiz_attempts
        WHERE created_at >= ${fromTime}
          AND created_at <= ${toTime}
          AND status = 'submitted'
      `,
      prisma.$queryRaw<
        Array<{
          lesson_type: lesson_type;
          total_records: number;
          completed_records: number;
        }>
      >`
        SELECT
          l.lesson_type,
          COUNT(lp.id)::int AS total_records,
          COUNT(lp.id) FILTER (WHERE lp.is_completed = true)::int AS completed_records
        FROM lessons l
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
        GROUP BY l.lesson_type
      `,
      prisma.quizzes.count({ where: quizWhereClause }),
      prisma.$queryRaw<
        Array<{
          quiz_id: string;
          quiz_title: string | null;
          lesson_title: string;
          course_title: string;
          passing_score: number;
          attempts_in_period: number;
          passed_in_period: number;
          pass_rate: number;
          average_score: number;
        }>
      >`
        WITH quiz_agg AS (
          SELECT
            q.id AS quiz_id,
            q.title AS quiz_title,
            l.title AS lesson_title,
            c.title AS course_title,
            q.passing_score,
            COUNT(qa.id) FILTER (
              WHERE qa.created_at >= ${fromTime}
                AND qa.created_at <= ${toTime}
                AND qa.status = 'submitted'
            )::int AS attempts_in_period,
            COUNT(qa.id) FILTER (
              WHERE qa.created_at >= ${fromTime}
                AND qa.created_at <= ${toTime}
                AND qa.status = 'submitted'
                AND qa.is_passed = true
            )::int AS passed_in_period,
            CASE
              WHEN COUNT(qa.id) FILTER (
                WHERE qa.created_at >= ${fromTime}
                  AND qa.created_at <= ${toTime}
                  AND qa.status = 'submitted'
              ) > 0
              THEN ROUND(
                (COUNT(qa.id) FILTER (
                  WHERE qa.created_at >= ${fromTime}
                    AND qa.created_at <= ${toTime}
                    AND qa.status = 'submitted'
                    AND qa.is_passed = true
                )::numeric / COUNT(qa.id) FILTER (
                  WHERE qa.created_at >= ${fromTime}
                    AND qa.created_at <= ${toTime}
                    AND qa.status = 'submitted'
                )) * 100,
                1
              )::float8
              ELSE 0::float8
            END AS pass_rate,
            COALESCE(
              ROUND(
                AVG(qa.score) FILTER (
                  WHERE qa.created_at >= ${fromTime}
                    AND qa.created_at <= ${toTime}
                    AND qa.status = 'submitted'
                )::numeric,
                1
              ),
              0
            )::float8 AS average_score
          FROM quizzes q
          JOIN lessons l ON l.id = q.lesson_id
          JOIN chapters ch ON ch.id = l.chapter_id
          JOIN courses c ON c.id = ch.course_id
          LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
          ${searchSql}
          GROUP BY q.id, l.title, c.title
        )
        SELECT *
        FROM quiz_agg
        ORDER BY ${orderCol} ${orderDir}, quiz_id ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
    ]);

    const quizStat = quizSummaryRows[0] ?? {
      total_attempts: 0,
      passed_attempts: 0,
      avg_score: 0,
    };

    const lessonTypeOrder: lesson_type[] = [
      lesson_type.video,
      lesson_type.quiz,
      lesson_type.text,
    ];
    const progressMap = new Map(
      lessonProgressByTypeRows.map((r) => [r.lesson_type, r]),
    );

    return {
      summary: {
        quizAttemptsInPeriod: quizStat.total_attempts,
        quizPassRate:
          quizStat.total_attempts > 0
            ? Number(
                (
                  (quizStat.passed_attempts / quizStat.total_attempts) *
                  100
                ).toFixed(1),
              )
            : 0,
        averageQuizScore: Number(quizStat.avg_score.toFixed(1)),
        lessonProgressByType: lessonTypeOrder.map((lt) => {
          const row = progressMap.get(lt);
          const totalRecords = row?.total_records ?? 0;
          const completedRecords = row?.completed_records ?? 0;
          return {
            lessonType: lt,
            totalRecords,
            completedRecords,
            completionRate:
              totalRecords > 0
                ? Number(((completedRecords / totalRecords) * 100).toFixed(1))
                : 0,
          };
        }),
      },
      quizzes: quizRows.map((r) => ({
        quizId: r.quiz_id,
        quizTitle: r.quiz_title || r.lesson_title,
        lessonTitle: r.lesson_title,
        courseTitle: r.course_title,
        passingScore: r.passing_score,
        attemptsInPeriod: r.attempts_in_period,
        passedInPeriod: r.passed_in_period,
        passRate: r.pass_rate,
        averageScore: r.average_score,
      })),
      pagination: buildPagination(page, limit, totalQuizzes),
    };
  }
}

export const adminStatsService = new AdminStatsService();
