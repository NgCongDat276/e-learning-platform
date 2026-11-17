import bcrypt from "bcryptjs";
import { enrollment_status, user_role } from "@prisma/client";
import prisma from "../src/prisma";

const STUDENT_COUNT = 100;
const DAYS_SPREAD = 60;

const FIRST_NAMES = [
  "An", "Anh", "Bình", "Bảo", "Chi", "Dũng", "Dương", "Đạt", "Giang", "Hà",
  "Hải", "Hạnh", "Hiếu", "Hoàng", "Hùng", "Huy", "Huyền", "Khang", "Khánh", "Khoa",
  "Kiên", "Lan", "Linh", "Long", "Mai", "Minh", "My", "Nam", "Ngân", "Ngọc",
  "Nhung", "Phong", "Phúc", "Phương", "Quân", "Quang", "Quỳnh", "Sơn", "Tâm", "Tân",
  "Thảo", "Thắng", "Thành", "Thịnh", "Thu", "Thủy", "Tiến", "Trang", "Trí", "Trung",
  "Tú", "Tuấn", "Tùng", "Uyên", "Vân", "Việt", "Vinh", "Vũ", "Vy", "Yến",
];

const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
];

const MIDDLE_NAMES = [
  "Văn", "Thị", "Minh", "Quốc", "Gia", "Hoàng", "Ngọc", "Thanh", "Thu", "Đức",
  "Hữu", "Anh", "Bảo", "Khánh", "Phương",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomDateBetween(start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return new Date(startMs + Math.random() * Math.max(endMs - startMs, 1000));
}

function randomCreatedAt(now: Date): Date {
  // Weight slightly towards more recent days so 1d/7d/30d filters all have good data
  const roll = Math.random();
  let daysAgo: number;
  if (roll < 0.08) {
    daysAgo = Math.random(); // within last 24h
  } else if (roll < 0.30) {
    daysAgo = 1 + Math.random() * 6; // 1-7 days ago
  } else if (roll < 0.72) {
    daysAgo = 7 + Math.random() * 23; // 7-30 days ago
  } else {
    daysAgo = 30 + Math.random() * (DAYS_SPREAD - 30); // 30-60 days ago
  }
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function randomEnrollmentStatus(): enrollment_status {
  const r = Math.random();
  if (r < 0.30) return enrollment_status.completed;
  if (r < 0.94) return enrollment_status.active;
  return enrollment_status.cancelled;
}

async function main() {
  const now = new Date();

  let courses = await prisma.courses.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      chapters: {
        select: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (courses.length === 0) {
    courses = await prisma.courses.findMany({
      select: {
        id: true,
        title: true,
        chapters: {
          select: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });
  }

  if (courses.length === 0) {
    console.log("No courses found in database. Please create at least one course first.");
    return;
  }

  const passwordHash = await bcrypt.hash("Student@123", 10);

  const studentPayloads = Array.from({ length: STUDENT_COUNT }, (_, i) => {
    const idx = String(i + 1).padStart(3, "0");
    const fullName = `${pickRandom(LAST_NAMES)} ${pickRandom(MIDDLE_NAMES)} ${pickRandom(FIRST_NAMES)}`;
    return {
      email: `student.seed.${idx}@lms.local`,
      password_hash: passwordHash,
      full_name: fullName,
      role: user_role.student,
      is_active: true,
      created_at: randomCreatedAt(now),
      updated_at: now,
    };
  });

  const createdUsersResult = await prisma.users.createMany({
    data: studentPayloads,
    skipDuplicates: true,
  });

  const seededStudents = await prisma.users.findMany({
    where: {
      email: { in: studentPayloads.map((s) => s.email) },
    },
    select: {
      id: true,
      email: true,
      created_at: true,
    },
  });

  const enrollmentPayloads: Array<{
    user_id: string;
    course_id: string;
    status: enrollment_status;
    enrolled_at: Date;
  }> = [];

  const progressPayloads: Array<{
    user_id: string;
    lesson_id: string;
    is_completed: boolean;
    updated_at: Date;
  }> = [];

  const maxCoursesPerStudent = Math.min(4, courses.length);

  for (const student of seededStudents) {
    const count = randomInt(1, maxCoursesPerStudent);
    const chosenCourses = shuffle(courses).slice(0, count);
    const createdAt = student.created_at ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const course of chosenCourses) {
      const status = randomEnrollmentStatus();
      const enrolledAt = randomDateBetween(createdAt, now);

      enrollmentPayloads.push({
        user_id: student.id,
        course_id: course.id,
        status,
        enrolled_at: enrolledAt,
      });

      if (status !== enrollment_status.cancelled) {
        const lessonIds = course.chapters.flatMap((ch) =>
          ch.lessons.map((l) => l.id),
        );
        for (const lessonId of lessonIds) {
          const shouldCreate =
            status === enrollment_status.completed || Math.random() < 0.6;
          if (shouldCreate) {
            progressPayloads.push({
              user_id: student.id,
              lesson_id: lessonId,
              is_completed:
                status === enrollment_status.completed
                  ? true
                  : Math.random() < 0.55,
              updated_at: randomDateBetween(enrolledAt, now),
            });
          }
        }
      }
    }
  }

  const createdEnrollmentsResult = await prisma.enrollments.createMany({
    data: enrollmentPayloads,
    skipDuplicates: true,
  });

  const createdProgressResult =
    progressPayloads.length > 0
      ? await prisma.lesson_progress.createMany({
          data: progressPayloads,
          skipDuplicates: true,
        })
      : { count: 0 };

  console.log("=== Seed Students Summary ===");
  console.log(`Courses available: ${courses.length}`);
  console.log(`Students created: ${createdUsersResult.count} (total seeded emails: ${seededStudents.length})`);
  console.log(`Enrollments created: ${createdEnrollmentsResult.count}`);
  console.log(`Lesson progress records created: ${createdProgressResult.count}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
