// app/api/schools/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { schools } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Return ID, name
    const data = await db.query.schools.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
      columns: { id: true, name: true },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("getSchools route error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
