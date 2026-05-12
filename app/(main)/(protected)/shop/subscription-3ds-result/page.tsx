import { cookies } from 'next/headers';
import Link from 'next/link';

import { getServerUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  parsePaymentFinalizeResponse,
  paymentFinalizeFailureUserMessage,
} from '@/lib/parse-payment-finalize-response';
import { extractAccessTokenFromSupabaseCookies } from '@/lib/supabase-access-token-from-cookies';

export const dynamic = 'force-dynamic';

type SearchParams = {
  status?: string;
  conversationId?: string;
  paymentId?: string;
  message?: string;
  flow?: string;
};

/**
 * Post-3DS return for Premium subscription checkout (`flow=subscription`).
 * Mirrors `private-lesson/credits/3ds-result` but finalizes via
 * `/api/payment/3ds/finalize-subscribe`.
 */
export default async function SubscriptionThreeDsResultPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) {
    return (
      <ResultShell tone="error" title="Oturum sona ermiş">
        <p>Ödemenizi doğrulamak için önce tekrar giriş yapmanız gerekiyor.</p>
        <Link
          href="/login?next=/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Giriş yap
        </Link>
      </ResultShell>
    );
  }

  const status = searchParams?.status;
  const conversationId = searchParams?.conversationId;
  const log = logger.child({
    labels: { route: 'shop/subscription-3ds-result' },
  });

  if (status === 'failure' || status === 'error') {
    return (
      <ResultShell tone="error" title="Ödeme doğrulanamadı">
        <p>{searchParams?.message ?? '3D Secure doğrulaması tamamlanamadı.'}</p>
        <p className="text-sm text-muted-foreground">
          Kartınızdan ücret çekilmedi. Lütfen tekrar deneyin veya farklı bir kart kullanın.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-xl bg-suk-payment px-4 py-2 font-medium text-suk-payment-fg hover:bg-suk-payment-hover"
        >
          Mağazaya dön
        </Link>
      </ResultShell>
    );
  }

  if (status !== 'pending') {
    return (
      <ResultShell tone="error" title="Beklenmeyen istek">
        <p>Ödeme sonucu bilinmiyor. Lütfen mağazadan tekrar deneyin.</p>
        <Link
          href="/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Mağazaya dön
        </Link>
      </ResultShell>
    );
  }

  const pendingCookie = cookies().get('sk_3ds_pending')?.value;
  if (!pendingCookie) {
    return (
      <ResultShell tone="error" title="Ödeme oturumu bulunamadı">
        <p>3D Secure oturumunun süresi doldu ya da çerez bulunamadı. Lütfen tekrar deneyin.</p>
        <Link
          href="/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Mağazaya dön
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
    log.warn('3ds pending cookie mismatch (subscription)', {
      cookieConversationId: pending?.conversationId,
      queryConversationId: conversationId,
    });
    return (
      <ResultShell tone="error" title="Oturum uyuşmazlığı">
        <p>Ödeme bağlamı doğrulanamadı. Güvenlik nedeniyle işlem iptal edildi.</p>
        <Link
          href="/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Mağazaya dön
        </Link>
      </ResultShell>
    );
  }

  const paymentServerUrl =
    process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL ?? 'http://localhost:3001';

  const accessToken = extractAccessTokenFromSupabaseCookies(cookies().getAll());
  if (!accessToken) {
    return (
      <ResultShell tone="error" title="Kimlik doğrulanamadı">
        <p>Oturum belirteci bulunamadı. Lütfen tekrar giriş yapın.</p>
        <Link
          href="/login?next=/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Giriş yap
        </Link>
      </ResultShell>
    );
  }

  let finalizeResponse: Response;
  try {
    finalizeResponse = await fetch(`${paymentServerUrl}/api/payment/3ds/finalize-subscribe`, {
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
      }),
      cache: 'no-store',
    });
  } catch (error) {
    log.error({
      message: '3ds finalize-subscribe request failed',
      error,
      location: 'subscription-3ds-result/page.tsx',
      userId: user.id,
      fields: { conversationId: pending.conversationId },
    });
    return (
      <ResultShell tone="error" title="Ödeme sunucusuna ulaşılamadı">
        <p>
          Ağ hatası nedeniyle ödemeniz tamamlanamadı. Lütfen kısa bir süre sonra mağazaya dönün;
          çift tahsilat olmaz.
        </p>
        <Link
          href="/shop"
          className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
        >
          Mağazaya dön
        </Link>
      </ResultShell>
    );
  }

  const finalizeParsed = await parsePaymentFinalizeResponse(finalizeResponse);
  const finalizeJson = finalizeParsed.json;
  if (finalizeParsed.parseError !== 'none') {
    log.warn('3ds finalize-subscribe body parse issue', {
      parseError: finalizeParsed.parseError,
      httpStatus: finalizeResponse.status,
      rawPreview: finalizeParsed.rawPreview?.slice(0, 200),
      userId: user.id,
    });
  }

  if (finalizeResponse.ok && finalizeJson.success) {
    return (
      <ResultShell tone="success" title="Ödeme başarılı">
        <p>
          {finalizeJson.message ??
            'Premium aboneliğiniz aktifleştirildi. Sınırsız can ve profil analizi kullanıma hazır.'}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-xl bg-suk-brand px-4 py-2 font-medium text-suk-brand-fg hover:bg-suk-brand-hover"
        >
          Mağazaya dön
        </Link>
      </ResultShell>
    );
  }

  return (
    <ResultShell tone="error" title="Ödeme tamamlanamadı">
      <p>{paymentFinalizeFailureUserMessage(finalizeResponse, finalizeJson, finalizeParsed)}</p>
      <Link
        href="/shop"
        className="font-medium text-suk-payment underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment-hover"
      >
        Mağazaya dön
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
  const borderColor =
    tone === 'success' ? 'border-suk-payment-ring/50' : 'border-suk-danger-line';
  const bg = tone === 'success' ? 'bg-suk-payment-soft' : 'bg-suk-danger-soft';
  const dot = tone === 'success' ? 'bg-suk-payment' : 'bg-suk-danger';

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12">
      <div className={`w-full rounded-2xl border ${borderColor} ${bg} p-8`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${dot}`} aria-hidden />
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-foreground/90">{children}</div>
      </div>
    </main>
  );
}
