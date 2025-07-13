import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to consolidated schools API
  const url = new URL(request.url);
  url.pathname = '/api/schools';
  url.searchParams.set('action', 'districts');
  
  return NextResponse.redirect(url.toString());
} 