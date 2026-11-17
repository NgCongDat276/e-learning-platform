import { Router } from "express";
import { user_role } from "@prisma/client";
import { authenticate } from "../../common/middlewares/authenticate";
import { authorize } from "../../common/middlewares/authorize";
import { validate } from "../../common/middlewares/validate";
import {
  courseRankingsQuerySchema,
  courseStatsQuerySchema,
  learningQualityQuerySchema,
  lecturerStatsQuerySchema,
  overviewQuerySchema,
} from "./admin-stats.schema";
import { adminStatsController } from "./admin-stats.controller";

const router = Router();

router.use(authenticate, authorize(user_role.admin));

router.get(
  "/overview",
  validate({ query: overviewQuerySchema }),
  adminStatsController.getOverview,
);

router.get(
  "/courses",
  validate({ query: courseStatsQuerySchema }),
  adminStatsController.getCourseStats,
);

router.get(
  "/lecturers",
  validate({ query: lecturerStatsQuerySchema }),
  adminStatsController.getLecturerStats,
);

router.get(
  "/learning-quality",
  validate({ query: learningQualityQuerySchema }),
  adminStatsController.getLearningQualityStats,
);

router.get(
  "/course-rankings",
  validate({ query: courseRankingsQuerySchema }),
  adminStatsController.getCourseCompletionRankings,
);

export default router;
