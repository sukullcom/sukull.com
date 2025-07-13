import { NextResponse } from "next/server";

// ✅ BACKWARD COMPATIBILITY: Redirect to consolidated user API
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/user', url.origin);
  redirectUrl.searchParams.set('action', 'credits');
  
  return NextResponse.redirect(redirectUrl, { status: 307 }); // Temporary redirect
} 