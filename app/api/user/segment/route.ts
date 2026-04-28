import { NextResponse } from "next/server";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * İstemci (Study Buddy vb.) için oturumlu kullanıcının öğrenme yolu.
 */
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ learningPath: null }, { status: 401 });
  }
  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, user.id),
    columns: { learningPath: true },
  });
  return NextResponse.json({
    learningPath: row?.learningPath ?? null,
  });
}
