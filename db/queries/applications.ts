/**
 * Teacher and student application queries.
 *
 * This module covers two admin-workflow surfaces that share the same shape:
 *   - `teacher_applications` (onboarding a new teacher)
 *   - `private_lesson_applications` (onboarding a new student)
 * plus the teacher-fields / role-check helpers used by the approval flow.
 *
 * The paginated listings (`*Paginated`) are the preferred entry points for
 * admin dashboards; the legacy `getAll*Applications` functions are kept for
 * backwards compatibility but stream the entire table.
 */
import { and, eq, ilike, or, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  privateLessonApplications,
  teacherApplications,
  teacherFields,
  users,
} from "@/db/schema";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "db/queries/applications" } });

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ApplicationStatusFilter = ApplicationStatus | "all";

export type AdminPaginationInput = {
  page?: number; // 1-indexed, defaults to 1
  pageSize?: number; // clamped to [1, 100]
  status?: ApplicationStatusFilter;
  q?: string;
};

export type AdminPaginatedResult<Row> = {
  rows: Row[];
  total: number;
  statusCounts: Record<ApplicationStatusFilter, number>;
  page: number;
  pageSize: number;
};

function normalizePagination(input: AdminPaginationInput): {
  page: number;
  pageSize: number;
  offset: number;
  status: ApplicationStatusFilter;
  q: string;
} {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.floor(input.pageSize ?? 20)),
  );
  const status: ApplicationStatusFilter =
    input.status === "pending" ||
    input.status === "approved" ||
    input.status === "rejected"
      ? input.status
      : "all";
  const q = (input.q ?? "").trim();
  return { page, pageSize, offset: (page - 1) * pageSize, status, q };
}

// ---------------------------------------------------------------------------
// Teacher applications
// ---------------------------------------------------------------------------

export async function saveTeacherApplication(applicationData: {
  userId: string;
  field: string;
  quizResult?: number;
  passed?: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
}) {
  const updatedData = {
    ...applicationData,
    quizResult: 0,
    passed: true,
  };

  return await db.insert(teacherApplications).values(updatedData);
}

export async function getAllTeacherApplications() {
  const applications = await db.query.teacherApplications.findMany({
    orderBy: (teacherApplications, { desc }) => [
      desc(teacherApplications.createdAt),
    ],
  });

  return applications.map((app) => ({
    id: app.id,
    userId: app.userId,
    teacherName: app.teacherName || "N/A",
    teacherSurname: app.teacherSurname || "N/A",
    teacherEmail: app.teacherEmail || "N/A",
    teacherPhoneNumber: app.teacherPhoneNumber || "N/A",
    field: app.field,
    education: app.education || null,
    experienceYears: app.experienceYears || null,
    targetLevels: app.targetLevels || null,
    availableHours: app.availableHours || null,
    lessonMode: app.lessonMode || null,
    hourlyRate: app.hourlyRate || null,
    bio: app.bio || null,
    quizResult: app.quizResult,
    passed: app.passed,
    classification: app.classification,
    status: app.status,
    createdAt: app.createdAt
      ? app.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: app.updatedAt
      ? app.updatedAt.toISOString()
      : new Date().toISOString(),
  }));
}

/* ------------------------------------------------------------------
 * Paginated admin listings
 *
 * Why this exists:
 *   The legacy `getAll*Applications()` functions stream the ENTIRE
 *   table to the client, which worked at 10s of applications but
 *   becomes a multi-MB payload + full scan + full-table memory
 *   pressure once applications cross 1K. These paginated variants
 *   push filtering & counting into the DB and return only the
 *   requested window plus aggregate counts.
 *
 * Shape contract (both variants):
 *   { rows, total, statusCounts, page, pageSize }
 * where `statusCounts` always covers { all, pending, approved, rejected }
 * so the UI can render the filter badges without a second round-trip.
 * ------------------------------------------------------------------ */
export async function getTeacherApplicationsPaginated(
  input: AdminPaginationInput,
): Promise<AdminPaginatedResult<ReturnType<typeof mapTeacherApplicationRow>>> {
  const { page, pageSize, offset, status, q } = normalizePagination(input);

  const searchPredicate =
    q.length > 0
      ? or(
          ilike(teacherApplications.teacherName, `%${q}%`),
          ilike(teacherApplications.teacherSurname, `%${q}%`),
          ilike(teacherApplications.teacherEmail, `%${q}%`),
          ilike(teacherApplications.field, `%${q}%`),
        )
      : undefined;

  const statusPredicate =
    status === "all" ? undefined : eq(teacherApplications.status, status);

  const combinedWhere =
    searchPredicate && statusPredicate
      ? and(searchPredicate, statusPredicate)
      : (searchPredicate ?? statusPredicate);

  const [rows, statusAgg, totalRow] = await Promise.all([
    db.query.teacherApplications.findMany({
      where: combinedWhere,
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: pageSize,
      offset,
    }),
    db
      .select({
        status: teacherApplications.status,
        count: sql<number>`count(*)::int`,
      })
      .from(teacherApplications)
      .where(searchPredicate)
      .groupBy(teacherApplications.status),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(teacherApplications)
      .where(combinedWhere),
  ]);

  const statusCounts: Record<ApplicationStatusFilter, number> = {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const row of statusAgg) {
    const key = row.status as ApplicationStatus;
    statusCounts[key] = row.count;
    statusCounts.all += row.count;
  }

  return {
    rows: rows.map(mapTeacherApplicationRow),
    total: totalRow[0]?.count ?? 0,
    statusCounts,
    page,
    pageSize,
  };
}

function mapTeacherApplicationRow(
  app: typeof teacherApplications.$inferSelect,
) {
  return {
    id: app.id,
    userId: app.userId,
    teacherName: app.teacherName || "N/A",
    teacherSurname: app.teacherSurname || "N/A",
    teacherEmail: app.teacherEmail || "N/A",
    teacherPhoneNumber: app.teacherPhoneNumber || "N/A",
    field: app.field,
    education: app.education || null,
    experienceYears: app.experienceYears || null,
    targetLevels: app.targetLevels || null,
    availableHours: app.availableHours || null,
    lessonMode: app.lessonMode || null,
    hourlyRate: app.hourlyRate || null,
    bio: app.bio || null,
    quizResult: app.quizResult,
    passed: app.passed,
    classification: app.classification,
    status: app.status,
    createdAt: app.createdAt
      ? app.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: app.updatedAt
      ? app.updatedAt.toISOString()
      : new Date().toISOString(),
  };
}

export async function getTeacherApplicationById(id: number) {
  return await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.id, id),
  });
}

export async function getTeacherApplicationByUserId(userId: string) {
  return await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.userId, userId),
  });
}

export async function approveTeacherApplication(id: number) {
  log.debug("approve teacher application", { id });

  const application = await getTeacherApplicationById(id);
  if (!application) {
    log.debug("application not found", { id });
    throw new Error("Başvuru bulunamadı.");
  }

  await db
    .update(teacherApplications)
    .set({
      status: "approved",
      updatedAt: new Date(),
    })
    .where(eq(teacherApplications.id, id));

  const roleUpdateResult = await db
    .update(users)
    .set({ role: "teacher" })
    .where(eq(users.id, application.userId))
    .returning({ id: users.id, role: users.role });

  if (roleUpdateResult.length === 0) {
    log.error({
      message: "no user found for role update",
      source: "server-action",
      location: "applications/approveTeacherApplication",
      fields: { applicationId: id, userId: application.userId },
    });
    throw new Error(
      `Rol güncellemesi için kullanıcı bulunamadı: ${application.userId}`,
    );
  }

  log.debug("teacher role updated", { userId: application.userId });
  return { success: true };
}

export async function approveTeacherApplicationWithFields(
  id: number,
  selectedFields: Array<{ subject: string; grade: string; displayName: string }>,
) {
  log.debug("approve teacher application with fields", {
    id,
    fieldCount: selectedFields.length,
  });

  const application = await getTeacherApplicationById(id);
  if (!application) {
    log.debug("application not found", { id });
    throw new Error("Başvuru bulunamadı.");
  }

  await db
    .update(teacherApplications)
    .set({
      status: "approved",
      updatedAt: new Date(),
    })
    .where(eq(teacherApplications.id, id));

  const roleUpdateResult = await db
    .update(users)
    .set({ role: "teacher" })
    .where(eq(users.id, application.userId))
    .returning({ id: users.id, role: users.role });

  if (roleUpdateResult.length === 0) {
    log.error({
      message: "no user found for role update",
      source: "server-action",
      location: "applications/approveTeacherApplicationWithFields",
      fields: { applicationId: id, userId: application.userId },
    });
    throw new Error(
      `Rol güncellemesi için kullanıcı bulunamadı: ${application.userId}`,
    );
  }

  if (selectedFields && selectedFields.length > 0) {
    await db
      .update(teacherFields)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teacherFields.teacherId, application.userId));

    const fieldsToInsert = selectedFields.map((field) => ({
      teacherId: application.userId,
      subject: field.subject,
      grade: field.grade,
      displayName: field.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(teacherFields).values(fieldsToInsert);
    log.debug("teacher fields inserted", {
      userId: application.userId,
      count: fieldsToInsert.length,
    });
  }

  log.debug("teacher role + fields updated", { userId: application.userId });
  return { success: true };
}

export async function rejectTeacherApplication(id: number) {
  await db
    .update(teacherApplications)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(teacherApplications.id, id));

  return { success: true };
}

// ---------------------------------------------------------------------------
// Teacher fields (capabilities)
// ---------------------------------------------------------------------------

export async function getTeacherFields(teacherId: string) {
  return await db.query.teacherFields.findMany({
    where: and(
      eq(teacherFields.teacherId, teacherId),
      eq(teacherFields.isActive, true),
    ),
    orderBy: [teacherFields.subject, teacherFields.grade],
  });
}

export async function updateTeacherFields(
  teacherId: string,
  fields: Array<{ subject: string; grade: string; displayName: string }>,
) {
  log.debug("update teacher fields", { teacherId, count: fields?.length ?? 0 });

  await db
    .update(teacherFields)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(teacherFields.teacherId, teacherId));

  if (fields && fields.length > 0) {
    const fieldsToInsert = fields.map((field) => ({
      teacherId,
      subject: field.subject,
      grade: field.grade,
      displayName: field.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(teacherFields).values(fieldsToInsert);
    log.debug("teacher fields updated", {
      teacherId,
      count: fieldsToInsert.length,
    });
  }

  return { success: true };
}

export async function getAvailableFieldOptions() {
  const subjects = [
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Coğrafya",
    "Edebiyat",
    "İngilizce",
    "Almanca",
    "Fransızca",
    "Felsefe",
    "Müzik",
    "Resim",
    "Bilgisayar Bilimleri",
    "Ekonomi",
  ];

  const grades = [
    "1.sınıf",
    "2.sınıf",
    "3.sınıf",
    "4.sınıf",
    "5.sınıf",
    "6.sınıf",
    "7.sınıf",
    "8.sınıf",
    "9.sınıf",
    "10.sınıf",
    "11.sınıf",
    "12.sınıf",
    "Hazırlık",
    "Üniversite",
    "Genel",
  ];

  return { subjects, grades };
}

// ---------------------------------------------------------------------------
// Role checks
// ---------------------------------------------------------------------------

export async function isTeacher(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.role === "teacher";
}

export async function isApprovedStudent(userId: string) {
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });

  if (userRecord?.role === "student") {
    return true;
  }

  const application = await db.query.privateLessonApplications.findFirst({
    where: and(
      eq(privateLessonApplications.userId, userId),
      eq(privateLessonApplications.approved, true),
    ),
  });

  return !!application;
}

// ---------------------------------------------------------------------------
// Student (private lesson) applications
// ---------------------------------------------------------------------------

export const saveStudentApplication = async (applicationData: {
  studentName: string;
  studentSurname: string;
  studentPhoneNumber: string;
  studentEmail: string;
  field: string;
  studentNeeds?: string;
}) => {
  const data = await db
    .insert(privateLessonApplications)
    .values(applicationData);
  return data;
};

export async function getAllStudentApplications() {
  const applications = await db.query.privateLessonApplications.findMany({
    orderBy: (privateLessonApplications, { desc }) => [
      desc(privateLessonApplications.createdAt),
    ],
  });

  return applications.map((app) => ({
    id: app.id,
    studentName: app.studentName,
    studentSurname: app.studentSurname,
    studentEmail: app.studentEmail,
    studentPhoneNumber: app.studentPhoneNumber,
    subject: app.field,
    studentLevel: app.studentLevel || null,
    lessonDuration: app.lessonDuration || null,
    availableHours: app.availableHours || null,
    budget: app.budget || null,
    lessonMode: app.lessonMode || null,
    status: app.status || "pending",
    approved: app.approved || false,
    userId: app.userId,
    studentNeeds: app.studentNeeds,
    createdAt: app.createdAt || new Date().toISOString(),
  }));
}

export async function getStudentApplicationsPaginated(
  input: AdminPaginationInput,
): Promise<AdminPaginatedResult<ReturnType<typeof mapStudentApplicationRow>>> {
  const { page, pageSize, offset, status, q } = normalizePagination(input);

  const searchPredicate =
    q.length > 0
      ? or(
          ilike(privateLessonApplications.studentName, `%${q}%`),
          ilike(privateLessonApplications.studentSurname, `%${q}%`),
          ilike(privateLessonApplications.studentEmail, `%${q}%`),
          ilike(privateLessonApplications.field, `%${q}%`),
        )
      : undefined;

  // `status` is plain text here (not enum); null rows are treated as pending.
  const statusPredicate =
    status === "all"
      ? undefined
      : status === "pending"
        ? or(
            eq(privateLessonApplications.status, "pending"),
            sql`${privateLessonApplications.status} IS NULL`,
          )
        : eq(privateLessonApplications.status, status);

  const combinedWhere =
    searchPredicate && statusPredicate
      ? and(searchPredicate, statusPredicate)
      : (searchPredicate ?? statusPredicate);

  const [rows, statusAgg, totalRow] = await Promise.all([
    db.query.privateLessonApplications.findMany({
      where: combinedWhere,
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: pageSize,
      offset,
    }),
    db
      .select({
        status: privateLessonApplications.status,
        count: sql<number>`count(*)::int`,
      })
      .from(privateLessonApplications)
      .where(searchPredicate)
      .groupBy(privateLessonApplications.status),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(privateLessonApplications)
      .where(combinedWhere),
  ]);

  const statusCounts: Record<ApplicationStatusFilter, number> = {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const row of statusAgg) {
    const rawStatus = (row.status ?? "pending") as ApplicationStatus;
    const key: ApplicationStatus =
      rawStatus === "approved" || rawStatus === "rejected"
        ? rawStatus
        : "pending";
    statusCounts[key] += row.count;
    statusCounts.all += row.count;
  }

  return {
    rows: rows.map(mapStudentApplicationRow),
    total: totalRow[0]?.count ?? 0,
    statusCounts,
    page,
    pageSize,
  };
}

function mapStudentApplicationRow(
  app: typeof privateLessonApplications.$inferSelect,
) {
  return {
    id: app.id,
    studentName: app.studentName,
    studentSurname: app.studentSurname,
    studentEmail: app.studentEmail,
    studentPhoneNumber: app.studentPhoneNumber,
    subject: app.field,
    studentLevel: app.studentLevel || null,
    lessonDuration: app.lessonDuration || null,
    availableHours: app.availableHours || null,
    budget: app.budget || null,
    lessonMode: app.lessonMode || null,
    status: (app.status || "pending") as ApplicationStatus,
    approved: app.approved || false,
    userId: app.userId,
    studentNeeds: app.studentNeeds,
    createdAt: app.createdAt
      ? app.createdAt instanceof Date
        ? app.createdAt.toISOString()
        : String(app.createdAt)
      : new Date().toISOString(),
  };
}

export async function approveStudentApplication(applicationId: number) {
  log.debug("approve student application", { applicationId });

  const application = await db.query.privateLessonApplications.findFirst({
    where: eq(privateLessonApplications.id, applicationId),
  });

  if (!application) {
    log.debug("student application not found", { applicationId });
    throw new Error("Başvuru bulunamadı.");
  }

  await db
    .update(privateLessonApplications)
    .set({
      approved: true,
      status: "approved",
    })
    .where(eq(privateLessonApplications.id, applicationId));

  if (application.userId) {
    const roleUpdateResult = await db
      .update(users)
      .set({ role: "student" })
      .where(eq(users.id, application.userId))
      .returning({ id: users.id, role: users.role });

    if (roleUpdateResult.length === 0) {
      log.error({
        message: "no user found for student role update",
        source: "server-action",
        location: "applications/approveStudentApplication",
        fields: { applicationId, userId: application.userId },
      });
      throw new Error(
        `Rol güncellemesi için kullanıcı bulunamadı: ${application.userId}`,
      );
    }

    log.debug("student role updated", { userId: application.userId });
  } else {
    log.warn("student application has no userId; role update skipped", {
      applicationId,
    });
  }
}

export async function rejectStudentApplication(applicationId: number) {
  await db
    .update(privateLessonApplications)
    .set({
      approved: false,
      status: "rejected",
    })
    .where(eq(privateLessonApplications.id, applicationId));
}
