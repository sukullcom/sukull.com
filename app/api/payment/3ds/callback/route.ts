import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

/**
 * POST /api/payment/3ds/callback
 *
 * Entry point for Iyzico's 3-D Secure callback. After the user completes
 * the OTP challenge at the issuer bank's ACS page, Iyzico POSTs this
 * endpoint with the signed payment state:
 *
 *     paymentId         — Iyzico payment id
 *     conversationData  — opaque, Iyzico-signed blob for finalize (optional for some issuers)
 *     conversationId    — the idempotencyKey we supplied at initialize
 *     status            — "success" | "failure"
 *     mdStatus          — "1" on successful 3DS auth, else a failure code
 *
 * Important: this endpoint is invoked by the *bank* redirecting the user's
 * browser. The body is usually `application/x-www-form-urlencoded`; some
 * stacks send `multipart/form-data`. A few redirects use GET with query params.
 *
 * Iyzico docs: conversationData "might return" on success — we must not
 * treat its absence as "missing result" if paymentId + conversationId exist.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CREDITS_3DS_RESULT_PATH = '/private-lesson/credits/3ds-result';
const SUBSCRIPTION_3DS_RESULT_PATH = '/shop/subscription-3ds-result';

function pickFormParam(form: URLSearchParams, names: readonly string[]): string {
  for (const name of names) {
    const v = form.get(name);
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

async function readCallbackForm(req: NextRequest): Promise<URLSearchParams> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    const sp = new URLSearchParams();
    for (const [key, value] of fd.entries()) {
      if (typeof value === 'string') sp.append(key, value);
    }
    return sp;
  }

  const bodyText = await req.text();
  return new URLSearchParams(bodyText);
}

function extractIyzicoCallbackFields(form: URLSearchParams) {
  return {
    paymentId: pickFormParam(form, ['paymentId', 'payment_id']),
    conversationData: pickFormParam(form, ['conversationData', 'conversation_data']),
    conversationId: pickFormParam(form, ['conversationId', 'conversation_id']),
    status: pickFormParam(form, ['status']),
    mdStatus: pickFormParam(form, ['mdStatus', 'md_status']),
  };
}

function handleCallback(req: NextRequest, form: URLSearchParams): NextResponse {
  const log = logger.child({ labels: { route: 'api/payment/3ds/callback' } });
  const origin = req.nextUrl.origin;
  const flow = req.nextUrl.searchParams.get('flow');
  const resultPath = flow === 'subscription' ? SUBSCRIPTION_3DS_RESULT_PATH : CREDITS_3DS_RESULT_PATH;

  const { paymentId, conversationData, conversationId, status, mdStatus } = extractIyzicoCallbackFields(form);

  if (!paymentId || !conversationId) {
    const keys = [...new Set([...form.keys()])].slice(0, 50);
    log.warn('3ds callback missing paymentId or conversationId', {
      hasPaymentId: Boolean(paymentId),
      hasConversationId: Boolean(conversationId),
      hasConversationData: Boolean(conversationData),
      formKeys: keys,
    });
    return redirectWithResult(origin, resultPath, {
      status: 'error',
      conversationId: conversationId || undefined,
      message: '3D Secure sonucu eksik. Lütfen yeniden deneyin.',
    });
  }

  if (status !== 'success' || mdStatus !== '1') {
    log.info('3ds auth not successful', { status, mdStatus, conversationId });
    return redirectWithResult(origin, resultPath, {
      status: 'failure',
      conversationId,
      message: '3D Secure doğrulaması başarısız oldu. Kartınızdan ücret çekilmedi.',
    });
  }

  const resultUrl = new URL(resultPath, origin);
  resultUrl.searchParams.set('conversationId', conversationId);
  resultUrl.searchParams.set('paymentId', paymentId);
  resultUrl.searchParams.set('status', 'pending');

  const passThrough = ['credits', 'totalPrice'] as const;
  for (const key of passThrough) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) resultUrl.searchParams.set(key, value);
  }
  if (flow === 'subscription') {
    resultUrl.searchParams.set('flow', 'subscription');
  }

  const stash = JSON.stringify({
    paymentId,
    conversationData: conversationData || '',
    conversationId,
  });
  const response = NextResponse.redirect(resultUrl, 303);
  response.cookies.set('sk_3ds_pending', stash, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}

export async function POST(req: NextRequest) {
  const log = logger.child({ labels: { route: 'api/payment/3ds/callback' } });
  const origin = req.nextUrl.origin;
  const flow = req.nextUrl.searchParams.get('flow');
  const resultPath = flow === 'subscription' ? SUBSCRIPTION_3DS_RESULT_PATH : CREDITS_3DS_RESULT_PATH;

  let form: URLSearchParams;
  try {
    form = await readCallbackForm(req);
  } catch (error) {
    log.error({
      message: 'failed to parse 3ds callback body',
      error,
      location: 'app/api/payment/3ds/callback/route.ts',
    });
    return redirectWithResult(origin, resultPath, {
      status: 'error',
      message: 'Ödeme doğrulama cevabı okunamadı.',
    });
  }

  return handleCallback(req, form);
}

/** Some acquirer flows redirect GET to merchant callback with query parameters. */
export async function GET(req: NextRequest) {
  return handleCallback(req, req.nextUrl.searchParams);
}

function redirectWithResult(
  origin: string,
  resultPath: string,
  { status, message, conversationId }: { status: 'error' | 'failure'; message: string; conversationId?: string },
) {
  const url = new URL(resultPath, origin);
  url.searchParams.set('status', status);
  url.searchParams.set('message', message);
  if (conversationId) url.searchParams.set('conversationId', conversationId);
  return NextResponse.redirect(url, 303);
}
