import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { sanitizeCourseWrite } from "@/lib/admin-write-sanitizers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  _req: Request,
  { params }: { params: { courseId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db.query.courses.findFirst({
    where: eq(courses.id, params.courseId),
  });

  return NextResponse.json(data);
};

export const PUT = async (
  req: Request,
  { params }: { params: { courseId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  // Explicit allow-list (defence-in-depth): admin tokens are
  // high-value and `.set({ ...body })` would silently accept any
  // column a future migration adds to `courses`. See
  // `lib/admin-write-sanitizers.ts` for the long-form rationale.
  const parsed = sanitizeCourseWrite(body, "update");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = await db
    .update(courses)
    .set(parsed.values)
    .where(eq(courses.id, params.courseId))
    .returning();

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  _req: Request,
  { params }: { params: { courseId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db
    .delete(courses)
    .where(eq(courses.id, params.courseId))
    .returning();

  return NextResponse.json(data[0]);
};
