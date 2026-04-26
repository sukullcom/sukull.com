import db from "@/db/drizzle";
import { challengeOptions } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: { challengeOptionId: number } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db.query.challengeOptions.findFirst({
    where: eq(challengeOptions.id, params.challengeOptionId),
  });

  return NextResponse.json(data);
};

export const PUT = async (
  req: Request,
  { params }: { params: { challengeOptionId: number } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Explicit allow-list — mirrors the POST handler. Do NOT spread
  // `...body` here: an admin token is the highest-privilege credential
  // in the system, and a spread would accept any future column added
  // by migrations (including ones we forgot to scrub from the admin
  // UI payload). Each field below is validated to its declared shape.
  const patch: Record<string, unknown> = {};

  if (body.challengeId !== undefined) {
    const n = Number(body.challengeId);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json(
        { error: "challengeId must be a positive number." },
        { status: 400 },
      );
    }
    patch.challengeId = n;
  }
  if (body.text !== undefined) {
    if (typeof body.text !== "string" || body.text.length === 0) {
      return NextResponse.json(
        { error: "text must be a non-empty string." },
        { status: 400 },
      );
    }
    patch.text = body.text;
  }
  if (body.correct !== undefined) patch.correct = Boolean(body.correct);
  if (body.imageSrc !== undefined) {
    patch.imageSrc = typeof body.imageSrc === "string" ? body.imageSrc : null;
  }
  if (body.audioSrc !== undefined) {
    patch.audioSrc = typeof body.audioSrc === "string" ? body.audioSrc : null;
  }
  if (body.correctOrder !== undefined) {
    patch.correctOrder =
      body.correctOrder === null
        ? null
        : Number.isFinite(Number(body.correctOrder))
          ? Math.trunc(Number(body.correctOrder))
          : null;
  }
  if (body.pairId !== undefined) {
    patch.pairId =
      body.pairId === null
        ? null
        : Number.isFinite(Number(body.pairId))
          ? Math.trunc(Number(body.pairId))
          : null;
  }
  if (body.isBlank !== undefined) patch.isBlank = Boolean(body.isBlank);
  if (body.dragData !== undefined) {
    patch.dragData = typeof body.dragData === "string" ? body.dragData : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const data = await db
    .update(challengeOptions)
    .set(patch)
    .where(eq(challengeOptions.id, params.challengeOptionId))
    .returning();

  if (data.length === 0) {
    return NextResponse.json({ error: "Challenge option not found." }, { status: 404 });
  }

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  req: Request,
  { params }: { params: { challengeOptionId: number } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 403 });
  }

  const data = await db
    .delete(challengeOptions)
    .where(eq(challengeOptions.id, params.challengeOptionId))
    .returning();

  return NextResponse.json(data[0]);
};
