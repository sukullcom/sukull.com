import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { privateLessonApplications } from "@/db/schema"
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
    const [{ count: total }] = await db.select({
        count: sql`count(*)`
    }).from(privateLessonApplications);
    
    // Get paginated data
    const data = await db.query.privateLessonApplications.findMany({
        limit: limit,
        offset: start,
        orderBy: (privateLessonApplications, { desc }) => [desc(privateLessonApplications.createdAt)]
    });
    
    // Add Content-Range header for React Admin pagination
    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `studentApplications ${start}-${Math.min(end, Number(total) - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');
    
    return response;
}