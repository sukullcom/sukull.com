import { NextRequest, NextResponse } from "next/server";

// ✅ BACKWARD COMPATIBILITY: Redirect to consolidated lessons API
export async function GET(
  request: Request,
  { params }: { params: { lessonId: number } }
) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/lessons', url.origin);
  redirectUrl.searchParams.set('action', 'get');
  redirectUrl.searchParams.set('id', params.lessonId.toString());
  
  return NextResponse.redirect(redirectUrl, { status: 307 });
}

export async function PUT(
  request: Request,
  { params }: { params: { lessonId: number } }
) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/lessons', url.origin);
  redirectUrl.searchParams.set('action', 'update-lesson');
  redirectUrl.searchParams.set('id', params.lessonId.toString());
  
  return NextResponse.redirect(redirectUrl, { status: 307 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { lessonId: number } }
) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/lessons', url.origin);
  redirectUrl.searchParams.set('action', 'delete-lesson');
  redirectUrl.searchParams.set('id', params.lessonId.toString());
  
  return NextResponse.redirect(redirectUrl, { status: 307 });
}