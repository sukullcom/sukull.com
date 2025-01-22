// app/api/clearToken/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Cookie silmek için maxAge=0 gibi
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", { path: "/", maxAge: 0 });
  return response;
}
