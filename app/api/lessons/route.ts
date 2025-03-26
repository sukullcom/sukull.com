import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { lessons } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { sql } from "drizzle-orm"

export const GET = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Parse pagination parameters
    const rangeHeader = req.headers.get('Range') || 'items=0-9';
    const [, rangeValue] = rangeHeader.split('=');
    const [startStr, endStr] = rangeValue.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const limit = end - start + 1;
    
    // Get total count
    const [{ count: totalCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(lessons);
    
    // Ensure total is a number
    const total = Number(totalCount);
    
    // Get paginated data
    const data = await db.query.lessons.findMany({
        limit: limit,
        offset: start,
        orderBy: (lessons, { desc }) => [desc(lessons.id)]
    });
    
    // Add Content-Range header for React Admin pagination
    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `lessons ${start}-${Math.min(end, total - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
    
    return response;
}


export const POST = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    const body = await req.json()

    const data = await db.insert(lessons).values({
        ...body,
    }).returning()

    return NextResponse.json(data[0])
}