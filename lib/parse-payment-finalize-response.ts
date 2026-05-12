/**
 * Payment-server finalize endpoints return JSON; proxies or misconfigured
 * URLs sometimes return HTML or an empty body. `.json()` then throws and
 * the UI fell back to a vague Turkish string with no HTTP context.
 */

export type ParsedFinalizeBody = {
  success?: boolean;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
  data?: {
    creditsAdded?: number;
    paymentId?: string;
    expiresAt?: string;
    subscriptionType?: string;
  };
};

export type FinalizeParseResult = {
  json: ParsedFinalizeBody;
  parseError: 'none' | 'empty' | 'invalid_json';
  rawPreview?: string;
};

export async function parsePaymentFinalizeResponse(res: Response): Promise<FinalizeParseResult> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { json: {}, parseError: 'empty' };
  }
  try {
    return { json: JSON.parse(trimmed) as ParsedFinalizeBody, parseError: 'none' };
  } catch {
    return { json: {}, parseError: 'invalid_json', rawPreview: trimmed.slice(0, 400) };
  }
}

/** User-facing line for the error card after a failed finalize. */
export function paymentFinalizeFailureUserMessage(
  res: Response,
  parsed: ParsedFinalizeBody,
  parseResult: FinalizeParseResult,
): string {
  const fromApi =
    (typeof parsed.message === 'string' && parsed.message.trim()) ||
    (typeof parsed.errorMessage === 'string' && parsed.errorMessage.trim());
  if (fromApi) return fromApi;

  if (parseResult.parseError === 'empty') {
    return `Ödeme sunucusu boş yanıt döndü (HTTP ${res.status}). Ortamda NEXT_PUBLIC_PAYMENT_SERVER_URL doğru mu kontrol edin; sorun sürerse destek ile iletişime geçin.`;
  }
  if (parseResult.parseError === 'invalid_json') {
    let msg = `Ödeme sunucusu JSON olmayan yanıt döndü (HTTP ${res.status}). Genelde yanlış URL, ağ geçidi veya HTML hata sayfası anlamına gelir.`;
    if (res.status === 404) {
      msg +=
        ' HTTP 404 ise adres genelde ana Next sitesidir; ödeme API’si orada yoktur. Railway’de ayrı servisin kök URL’sini NEXT_PUBLIC_PAYMENT_SERVER_URL veya sunucu tarafı için PAYMENT_SERVER_URL ile verin.';
    }
    return msg;
  }

  return 'Ödeme doğrulaması sırasında bir sorun oluştu.';
}
