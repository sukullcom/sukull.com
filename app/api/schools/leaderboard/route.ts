import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to consolidated schools API
  const url = new URL(request.url);
  url.pathname = '/api/schools';
  url.searchParams.set('action', 'leaderboard');
  
  return NextResponse.redirect(url.toString());
}

export async function POST(request: NextRequest) {
  // Redirect POST requests to consolidated schools API
  const url = new URL(request.url);
  url.pathname = '/api/schools';
  
  return fetch(url.toString(), {
    method: 'POST',
    headers: request.headers,
    body: await request.text()
  });
} 