import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { units } from "@/db/schema"
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
    }).from(units);

    const total = Number(totalCount);

    const data = await db.query.units.findMany({
        limit: limit,
        offset: start,
        orderBy: (units, { desc }) => [desc(units.id)]
    });

    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `units ${start}-${Math.min(end, total - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');

    return response;
}

export const POST = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const courseId = Number(body.courseId);
    const order = Number(body.order);

    if (!title) {
        return NextResponse.json({ error: "title alanı zorunludur." }, { status: 400 });
    }
    if (!description) {
        return NextResponse.json({ error: "description alanı zorunludur." }, { status: 400 });
    }
    if (!Number.isFinite(courseId) || courseId <= 0) {
        return NextResponse.json({ error: "courseId alanı zorunludur." }, { status: 400 });
    }
    if (!Number.isFinite(order)) {
        return NextResponse.json({ error: "order alanı zorunludur." }, { status: 400 });
    }

    const data = await db.insert(units).values({
        title,
        description,
        courseId: Math.trunc(courseId),
        order: Math.trunc(order),
    }).returning();

    return NextResponse.json(data[0]);
}
