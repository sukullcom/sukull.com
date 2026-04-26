import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { courses } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { parseRangeHeader } from "@/lib/pagination"
import { sql } from "drizzle-orm"

export const GET = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }

    const { start, end, limit } = parseRangeHeader(req.headers.get('Range'));

    const [{ count: totalCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(courses);

    const total = Number(totalCount);

    const data = await db.query.courses.findMany({
        limit: limit,
        offset: start,
        orderBy: (courses, { desc }) => [desc(courses.id)]
    });

    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `courses ${start}-${Math.min(end, total - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');

    return response;
}

// See `challengeOptions/route.ts` for the reasoning behind the explicit
// allow-list (defence-in-depth against `...body` accepting future-added
// privileged columns if an admin token leaks).
const COURSE_INSERT_FIELDS = ["title", "imageSrc"] as const;

export const POST = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const imageSrc = typeof body.imageSrc === "string" ? body.imageSrc.trim() : "";

    if (!title) {
        return NextResponse.json({ error: "title alanı zorunludur." }, { status: 400 });
    }
    if (!imageSrc) {
        return NextResponse.json({ error: "imageSrc alanı zorunludur." }, { status: 400 });
    }

    void COURSE_INSERT_FIELDS; // documents the allow-list; values below are derived from it.
    const data = await db.insert(courses).values({ title, imageSrc }).returning();

    return NextResponse.json(data[0]);
}
