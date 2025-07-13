import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to consolidated schools API, converting 'step' to 'action'
  const url = new URL(request.url);
  const step = url.searchParams.get('step');
  
  url.pathname = '/api/schools';
  url.searchParams.delete('step');
  if (step) {
    url.searchParams.set('action', step);
  }
  
  return NextResponse.redirect(url.toString());
} 