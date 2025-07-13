import { NextRequest, NextResponse } from 'next/server';
import { updateTotalPointsForSchools } from '@/actions/user-progress';

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called from a cron job (optional security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting school points update cron job...');
    const startTime = Date.now();
    
    const success = await updateTotalPointsForSchools();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (success) {
      console.log(`School points update completed successfully in ${duration}ms`);
      return NextResponse.json({ 
        success: true, 
        message: `School points updated successfully in ${duration}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('School points update failed');
      return NextResponse.json({ 
        success: false, 
        error: 'School points update failed' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('School points cron job error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow POST method as well for manual triggers
  return GET(request);
} 