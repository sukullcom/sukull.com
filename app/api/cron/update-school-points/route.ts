import { NextRequest, NextResponse } from 'next/server';
import { updateTotalPointsForSchools } from '@/actions/user-progress';
import { getRequestLogger } from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';

export async function GET(request: NextRequest) {
  const log = await getRequestLogger({ labels: { module: 'cron', job: 'update-school-points' } });
  try {
    // Manuel/yardımcı uç. Tahmin edilebilir token bypass'ı için secret zorunlu;
    // `verifyCronAuth` tanımsız secret'ta otomatik 401 döner.
    const auth = verifyCronAuth(request, { allowVercelCronHeader: false });
    if (!auth.ok) {
      log.warn('unauthorized cron attempt', { reason: auth.reason });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('school points cron started');
    const startTime = Date.now();

    const success = await updateTotalPointsForSchools();

    const duration = Date.now() - startTime;

    if (success) {
      log.info('school points cron completed', { durationMs: duration });
      return NextResponse.json({
        success: true,
        message: `School points updated successfully in ${duration}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      log.error({
        message: 'school points cron reported failure',
        source: 'cron',
        location: 'cron/update-school-points',
        fields: { durationMs: duration },
      });
      return NextResponse.json({
        success: false,
        error: 'School points update failed'
      }, { status: 500 });
    }
  } catch (error) {
    log.error({
      message: 'school points cron threw',
      error,
      source: 'cron',
      location: 'cron/update-school-points',
    });
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