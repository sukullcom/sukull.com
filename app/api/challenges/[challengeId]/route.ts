import { NextResponse } from "next/server"
import db from "@/db/drizzle"
import { challenges } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { eq } from "drizzle-orm"

export const GET = async (
  req: Request,
  { params }: { params: { challengeId: string } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const challengeId = parseInt(params.challengeId);
  
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      challengeOptions: true,
      lesson: {
        with: {
          unit: true
        }
      }
    }
  });

  if (!challenge) {
    return new NextResponse("Challenge not found", { status: 404 });
  }

  return NextResponse.json(challenge);
};

export const PUT = async (
  req: Request,
  { params }: { params: { challengeId: string } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const challengeId = parseInt(params.challengeId);
  const body = await req.json();

  const data = await db
    .update(challenges)
    .set(body)
    .where(eq(challenges.id, challengeId))
    .returning();

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  req: Request,
  { params }: { params: { challengeId: string } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const challengeId = parseInt(params.challengeId);

  await db.delete(challenges).where(eq(challenges.id, challengeId));

  return new NextResponse(null, { status: 204 });
};
