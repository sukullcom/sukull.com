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
 *     conversationData  — opaque, Iyzico-signed blob for finalize
 *     conversationId    — the idempotencyKey we supplied at initialize
 *     status            — "success" | "failure"
 *     mdStatus          — "1" on successful 3DS auth, else a failure code
 *
 * Important: this endpoint is invoked by the *bank* redirecting the user's
 * browser, so the POST body arrives as `application/x-www-form-urlencoded`
 * (not JSON). We forward the relevant fields to the payment-server, which
 * alone talks to Iyzico, then 303-redirect the browser to the result page.
 *
 * We never expose the payment-server URL to the client beyond what
 * `NEXT_PUBLIC_PAYMENT_SERVER_URL` already reveals; this route runs on our
 * infra and keeps the bearer token hop inside a server-to-server call.
 *
 * Failure modes are all terminal for *this* payment attempt — we do not
 * retry here. Users can always restart from the purchase page (the
 * idempotencyKey guards against duplicate credits).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESULT_PATH = '/private-lesson/credits/3ds-result';

export async function POST(req: NextRequest) {
  const log = logger.child({ labels: { route: 'api/payment/3ds/callback' } });
  const origin = req.nextUrl.origin;

  let form: URLSearchParams;
  try {
    const bodyText = await req.text();
    form = new URLSearchParams(bodyText);
  } catch (error) {
    log.error({
      message: 'failed to parse 3ds callback body',
      error,
      location: 'app/api/payment/3ds/callback/route.ts',
    });
    return redirectWithResult(origin, {
      status: 'error',
      message: 'Ödeme doğrulama cevabı okunamadı.',
    });
  }

  const paymentId = form.get('paymentId') ?? '';
  const conversationData = form.get('conversationData') ?? '';
  const conversationId = form.get('conversationId') ?? '';
  const status = form.get('status') ?? '';
  const mdStatus = form.get('mdStatus') ?? '';

  // Guardrails before we even consider forwarding. Any of these failing
  // indicates a malformed or hostile request; we refuse and log.
  if (!paymentId || !conversationData || !conversationId) {
    log.warn('3ds callback missing required fields', {
      hasPaymentId: Boolean(paymentId),
      hasConversationData: Boolean(conversationData),
      hasConversationId: Boolean(conversationId),
    });
    return redirectWithResult(origin, {
      status: 'error',
      conversationId,
      message: '3D Secure sonucu eksik. Lütfen yeniden deneyin.',
    });
  }

  if (status !== 'success' || mdStatus !== '1') {
    log.info('3ds auth not successful', { status, mdStatus, conversationId });
    return redirectWithResult(origin, {
      status: 'failure',
      conversationId,
      message: '3D Secure doğrulaması başarısız oldu. Kartınızdan ücret çekilmedi.',
    });
  }

  // Bridge cookie: the next page needs to know which conversation we just
  // finalized so it can show a tailored result. We set a short-lived,
  // httpOnly cookie instead of leaking paymentId in the query string.
  const resultUrl = new URL(RESULT_PATH, origin);
  resultUrl.searchParams.set('conversationId', conversationId);
  resultUrl.searchParams.set('paymentId', paymentId);
  resultUrl.searchParams.set('status', 'pending');

  // The purchase context (credits, price) is passed through the callback URL
  // query string at initialize-time; issuer banks preserve the query string
  // when POST-redirecting back. We forward both to the result page so the
  // server-side finalize call knows what to settle. The payment-server
  // re-validates these against its stored idempotency record, so a tampered
  // value cannot inflate credits.
  const passThrough = ['credits', 'totalPrice'] as const;
  for (const key of passThrough) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) resultUrl.searchParams.set(key, value);
  }

  // We do NOT call the payment-server from here directly — the browser
  // reaching this URL is unauthenticated from the bank's hop. Finalization
  // must run with the user's Supabase JWT, which we only have on the
  // result page. The result page will issue the finalize call and then
  // render the outcome.
  //
  // This also means the bank callback is always "fast" — no downstream
  // Iyzico API round-trip happens on this hop, avoiding bank timeouts on
  // slow finalize calls.
  const stash = JSON.stringify({ paymentId, conversationData, conversationId });
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

function redirectWithResult(
  origin: string,
  { status, message, conversationId }: { status: 'error' | 'failure'; message: string; conversationId?: string },
) {
  const url = new URL(RESULT_PATH, origin);
  url.searchParams.set('status', status);
  url.searchParams.set('message', message);
  if (conversationId) url.searchParams.set('conversationId', conversationId);
  return NextResponse.redirect(url, 303);
}
