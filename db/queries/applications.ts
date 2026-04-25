/**
 * Teacher application & role-check queries.
 *
 * The 0026 marketplace refactor removed the separate student
 * application flow: anyone logged in can now open a listing or message
 * a teacher (credits-gated), so there is no `student` role distinct
 * from regular users. The only admin-workflow surface left here is
 * `teacher_applications`.
 */
import { and, eq, ilike, or, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { teacherApplications, teacherFields, users } from "@/db/schema";
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

export type SaveTeacherApplicationInput = {
  userId: string;
  field: string;
  quizResult?: number;
  passed?: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
  education?: string;
  experienceYears?: string;
  targetLevels?: string;
  availableHours?: string;
  lessonMode?: string; // 'online' | 'in_person' | 'both'
  hourlyRate?: string; // legacy combined field
  hourlyRateOnline?: number | null;
  hourlyRateInPerson?: number | null;
  city?: string;
  district?: string;
  bio?: string;
  classification?: string;
};

export async function saveTeacherApplication(
  applicationData: SaveTeacherApplicationInput,
) {
  return await db.insert(teacherApplications).values({
    ...applicationData,
    quizResult: applicationData.quizResult ?? 0,
    passed: applicationData.passed ?? true,
  });
}

export async function getAllTeacherApplications() {
  const applications = await db.query.teacherApplications.findMany({
    orderBy: (teacherApplications, { desc }) => [
      desc(teacherApplications.createdAt),
    ],
  });

  return applications.map(mapTeacherApplicationRow);
}

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
    hourlyRateOnline: app.hourlyRateOnline ?? null,
    hourlyRateInPerson: app.hourlyRateInPerson ?? null,
    city: app.city || null,
    district: app.district || null,
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
    columns: { role: true },
  });

  return user?.role === "teacher";
}

/**
 * Back-compat shim for callers that still imported `isApprovedStudent`.
 *
 * The marketplace refactor removed the "approved student" gate — any
 * logged-in user can use the platform directly. This helper now simply
 * returns `true` for every authenticated user so legacy call sites
 * keep compiling; new code should not call it.
 */
export async function isApprovedStudent(userId: string): Promise<boolean> {
  if (!userId) return false;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  });
  return !!user;
}
