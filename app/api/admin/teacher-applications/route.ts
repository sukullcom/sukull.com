import { NextResponse } from "next/server";

// ✅ BACKWARD COMPATIBILITY: Redirect to consolidated admin API
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/admin', url.origin);
  redirectUrl.searchParams.set('action', 'teacher-applications');
  
  return NextResponse.redirect(redirectUrl, { status: 307 }); // Temporary redirect
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/admin', url.origin);
  redirectUrl.searchParams.set('action', 'teacher-applications');
  
  return NextResponse.redirect(redirectUrl, { status: 307 });
} 