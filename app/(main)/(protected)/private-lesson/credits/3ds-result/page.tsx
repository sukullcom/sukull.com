import { cookies } from 'next/headers';
import Link from 'next/link';

import { getServerUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

type SearchParams = {
  status?: string;
  conversationId?: string;
  paymentId?: string;
  message?: string;
  credits?: string;
  totalPrice?: string;
};

/**
 * Landing page the user returns to after completing (or failing) the 3DS
 * OTP challenge at their bank. Responsibilities:
 *
 *   1. If the callback handler stashed a signed 3DS payload into the
 *      `sk_3ds_pending` cookie, call the payment-server's finalize
 *      endpoint with the user's Supabase JWT and settle the purchase.
 *   2. Otherwise (failure/error redirect from the callback handler) show
 *      a user-facing explanation with a retry link.
 *
 * We deliberately put the finalize call here rather than in the callback
 * route handler because:
 *
 *   * The bank's redirect to the callback is unauthenticated from our
 *     perspective — the user's Supabase JWT is held by their browser as
 *     cookies but not easy to forward reliably in a server-to-server
 *     context.
 *   * A slow Iyzico finalize call on the callback hop risks the bank
 *     timing out and showing a confusing "your browser didn't return"
 *     screen. Deferring it to this page keeps the bank-side UX snappy.
 */
export default async function ThreeDsResultPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) {
    return (
      <ResultShell tone="error" title="Oturum sona ermiş">
        <p>Ödemenizi doğrulamak için önce tekrar giriş yapmanız gerekiyor.</p>
        <Link href="/login?next=/private-lesson/credits" className="text-green-700 underline">
          Giriş yap
        </Link>
      </ResultShell>
    );
  }

  const status = searchParams?.status;
  const conversationId = searchParams?.conversationId;
  const log = logger.child({
    labels: { route: 'private-lesson/credits/3ds-result' },
  });

  if (status === 'failure' || status === 'error') {
    return (
      <ResultShell tone="error" title="Ödeme doğrulanamadı">
        <p>{searchParams?.message ?? '3D Secure doğrulaması tamamlanamadı.'}</p>
        <p className="text-sm text-slate-500">
          Kartınızdan ücret çekilmedi. Lütfen tekrar deneyin veya farklı bir kart kullanın.
        </p>
        <Link
          href="/private-lesson/credits"
          className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Kredi sayfasına dön
        </Link>
      </ResultShell>
    );
  }

  if (status !== 'pending') {
    return (
      <ResultShell tone="error" title="Beklenmeyen istek">
        <p>Ödeme sonucu bilinmiyor. Lütfen kredi sayfasından tekrar deneyin.</p>
        <Link href="/private-lesson/credits" className="text-green-700 underline">
          Kredi sayfasına dön
        </Link>
      </ResultShell>
    );
  }

  const pendingCookie = cookies().get('sk_3ds_pending')?.value;
  if (!pendingCookie) {
    return (
      <ResultShell tone="error" title="Ödeme oturumu bulunamadı">
        <p>3D Secure oturumunun süresi doldu ya da çerez bulunamadı. Lütfen tekrar deneyin.</p>
        <Link href="/private-lesson/credits" className="text-green-700 underline">
          Kredi sayfasına dön
        </Link>
      </ResultShell>
    );
  }

  let pending: { paymentId: string; conversationData: string; conversationId: string } | null = null;
  try {
    pending = JSON.parse(pendingCookie);
  } catch {
    pending = null;
  }

  if (!pending || pending.conversationId !== conversationId) {
    log.warn('3ds pending cookie mismatch', {
      cookieConversationId: pending?.conversationId,
      queryConversationId: conversationId,
    });
    return (
      <ResultShell tone="error" title="Oturum uyuşmazlığı">
        <p>Ödeme bağlamı doğrulanamadı. Güvenlik nedeniyle işlem iptal edildi.</p>
        <Link href="/private-lesson/credits" className="text-green-700 underline">
          Kredi sayfasına dön
        </Link>
      </ResultShell>
    );
  }

  // Forward to the payment-server for Iyzico finalization. We deliberately
  // do this in a server component so the Supabase bearer token can be
  // assembled without exposing it to the client.
  const paymentServerUrl =
    process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL ?? 'http://localhost:3001';

  // We need a service-role JWT for the payment-server's `authenticateUser`.
  // Getting the browser user's access token on the server requires reading
  // the sb-*-auth-token cookie and parsing it.
  const accessToken = extractAccessToken(cookies().getAll());
  if (!accessToken) {
    return (
      <ResultShell tone="error" title="Kimlik doğrulanamadı">
        <p>Oturum belirteci bulunamadı. Lütfen tekrar giriş yapın.</p>
        <Link href="/login" className="text-green-700 underline">Giriş yap</Link>
      </ResultShell>
    );
  }

  // Credits / price are submitted back to the payment-server so that *it*
  // (the service that owns the DB) decides settlement, not the client page.
  // We still forward what the user originally chose — the server cross-
  // checks this against the initialize log row, so a tampered payload
  // would fail the idempotency step.
  const creditsAmount = Number(searchParams?.credits ?? 0);
  const totalPrice = Number(searchParams?.totalPrice ?? 0);

  let finalizeResponse: Response;
  try {
    finalizeResponse = await fetch(`${paymentServerUrl}/api/payment/3ds/finalize-credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        paymentId: pending.paymentId,
        conversationData: pending.conversationData,
        conversationId: pending.conversationId,
        status: 'success',
        mdStatus: '1',
        creditsAmount,
        totalPrice,
      }),
      cache: 'no-store',
    });
  } catch (error) {
    log.error({
      message: '3ds finalize request failed',
      error,
      location: '3ds-result/page.tsx',
      userId: user.id,
      fields: { conversationId: pending.conversationId },
    });
    return (
      <ResultShell tone="error" title="Ödeme sunucusuna ulaşılamadı">
        <p>Ağ hatası nedeniyle ödemeniz tamamlanamadı. Lütfen kısa bir süre sonra kredi sayfasına dönün; çift tahsilat olmaz.</p>
        <Link href="/private-lesson/credits" className="text-green-700 underline">
          Kredi sayfasına dön
        </Link>
      </ResultShell>
    );
  }

  let finalizeJson: { success?: boolean; message?: string; data?: { creditsAdded?: number } } = {};
  try {
    finalizeJson = (await finalizeResponse.json()) as typeof finalizeJson;
  } catch {
    finalizeJson = {};
  }

  if (finalizeResponse.ok && finalizeJson.success) {
    return (
      <ResultShell tone="success" title="Ödeme başarılı">
        <p>
          {finalizeJson.message ??
            `${finalizeJson.data?.creditsAdded ?? creditsAmount} kredi hesabınıza eklendi.`}
        </p>
        <Link
          href="/private-lesson"
          className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Derslere göz at
        </Link>
      </ResultShell>
    );
  }

  return (
    <ResultShell tone="error" title="Ödeme tamamlanamadı">
      <p>{finalizeJson.message ?? 'Ödeme doğrulaması sırasında bir sorun oluştu.'}</p>
      <Link href="/private-lesson/credits" className="text-green-700 underline">
        Kredi sayfasına dön
      </Link>
    </ResultShell>
  );
}

function ResultShell({
  tone,
  title,
  children,
}: {
  tone: 'success' | 'error';
  title: string;
  children: React.ReactNode;
}) {
  const borderColor = tone === 'success' ? 'border-green-200' : 'border-red-200';
  const bg = tone === 'success' ? 'bg-green-50' : 'bg-red-50';
  const dot = tone === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12">
      <div className={`w-full rounded-2xl border ${borderColor} ${bg} p-8`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${dot}`} aria-hidden />
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-slate-700">{children}</div>
      </div>
    </main>
  );
}

/**
 * Pulls the access token out of the Supabase `sb-*-auth-token` cookie.
 * The cookie payload is `base64-<base64json>` where the JSON has an
 * `access_token` field. This is the same format `@supabase/ssr` writes.
 */
function extractAccessToken(
  cookiesList: Array<{ name: string; value: string }>,
): string | null {
  const authCookie = cookiesList.find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
  );
  if (!authCookie) return null;

  try {
    let payload = authCookie.value;
    if (payload.startsWith('base64-')) payload = payload.slice('base64-'.length);
    payload = decodeURIComponent(payload);
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const json = JSON.parse(decoded) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}
