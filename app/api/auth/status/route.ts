import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getServerUser();
    
    return NextResponse.json({
      authenticated: !!user,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 