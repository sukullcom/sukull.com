import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    console.log('=== AUTH STATUS CHECK ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check Supabase session directly
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Supabase session error:', error);
    console.log('Supabase session exists:', !!session);
    console.log('Session user ID:', session?.user?.id);
    
    // Check our wrapper function
    const user = await getServerUser();
    console.log('getServerUser result:', !!user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    
    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      supabaseSession: !!session,
      supabaseUserId: session?.user?.id || null,
      supabaseError: error?.message || null,
      timestamp: new Date().toISOString(),
      cookies: request.headers.get('cookie') ? 'present' : 'missing'
    });
    
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 