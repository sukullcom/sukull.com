import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";

export type SchoolCatalogFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * `/api/schools` okuma — 429 ve ağ hatalarında onboarding’de anlamlı mesaj.
 */
export async function fetchSchoolCatalogJson<T>(
  url: string,
  /** Örn. "Şehirler", "İlçeler" — API gövdesinde `error` yoksa kullanılır */
  fallbackLabel: string,
): Promise<SchoolCatalogFetchResult<T>> {
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      return {
        ok: false,
        message:
          "Şu an çok sayıda istek var. Lütfen yaklaşık bir dakika bekleyip tekrar deneyin.",
      };
    }
    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { error?: string };
        if (typeof j.error === "string" && j.error.trim()) {
          detail = j.error.trim();
        }
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        message: detail || `${fallbackLabel} yüklenemedi.`,
      };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, message: getClientAuthTransientErrorMessage(e) };
  }
}
