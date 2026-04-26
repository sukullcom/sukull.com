import db from "@/db/drizzle";
import { units } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { sanitizeUnitWrite } from "@/lib/admin-write-sanitizers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  _req: Request,
  { params }: { params: { unitId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db.query.units.findFirst({
    where: eq(units.id, params.unitId),
  });

  return NextResponse.json(data);
};

export const PUT = async (
  req: Request,
  { params }: { params: { unitId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  // Explicit allow-list (see `lib/admin-write-sanitizers.ts`). Guards
  // against future migrations silently widening the admin write
  // surface through the `...body` spread that used to live here.
  const parsed = sanitizeUnitWrite(body, "update");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = await db
    .update(units)
    .set(parsed.values)
    .where(eq(units.id, params.unitId))
    .returning();

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  _req: Request,
  { params }: { params: { unitId: number } },
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db
    .delete(units)
    .where(eq(units.id, params.unitId))
    .returning();

  return NextResponse.json(data[0]);
};
