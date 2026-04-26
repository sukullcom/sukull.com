import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { challengeOptions } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { parseRangeHeader } from "@/lib/pagination"
import { sql } from "drizzle-orm"

export const GET = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }

    const { start, end, limit } = parseRangeHeader(req.headers.get('Range'));
    
    // Get total count
    const [{ count: totalCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(challengeOptions);
    
    // Ensure total is a number
    const total = Number(totalCount);
    
    // Get paginated data
    const data = await db.query.challengeOptions.findMany({
        limit: limit,
        offset: start,
        orderBy: (challengeOptions, { desc }) => [desc(challengeOptions.id)]
    });
    
    // Add Content-Range header for React Admin pagination
    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `challengeOptions ${start}-${Math.min(end, total - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
    
    return response;
}


export const POST = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Explicit allow-list: admin tokens are high-value and `values({ ...body })`
    // would silently accept any column Drizzle knows about — including
    // fields introduced by future migrations that weren't considered
    // here (defence-in-depth against "schema grew → admin form shipped
    // an extra field I didn't mean to expose").
    const challengeId = Number(body.challengeId);
    if (!Number.isFinite(challengeId) || challengeId <= 0) {
        return NextResponse.json(
            { error: "challengeId is required and must be a positive number." },
            { status: 400 },
        );
    }
    const text = typeof body.text === "string" ? body.text : null;
    if (!text || text.length === 0) {
        return NextResponse.json(
            { error: "text is required." },
            { status: 400 },
        );
    }

    const values = {
        challengeId,
        text,
        correct: Boolean(body.correct),
        imageSrc: typeof body.imageSrc === "string" ? body.imageSrc : null,
        audioSrc: typeof body.audioSrc === "string" ? body.audioSrc : null,
        correctOrder:
            body.correctOrder === null || body.correctOrder === undefined
                ? null
                : Number.isFinite(Number(body.correctOrder))
                    ? Math.trunc(Number(body.correctOrder))
                    : null,
        pairId:
            body.pairId === null || body.pairId === undefined
                ? null
                : Number.isFinite(Number(body.pairId))
                    ? Math.trunc(Number(body.pairId))
                    : null,
        isBlank: typeof body.isBlank === "boolean" ? body.isBlank : false,
        dragData: typeof body.dragData === "string" ? body.dragData : null,
    };

    const data = await db.insert(challengeOptions).values(values).returning();

    return NextResponse.json(data[0])
}