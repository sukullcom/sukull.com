import { getService } from "@/lib/marketplace/catalog";

export function greetingName(firstName: string, lastName: string, fallback: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return fallback.trim() || "Merhaba";
}

/** Talep kartında görünen kısa ad: Numan K. */
export function publicCustomerName(firstName: string, lastName: string, fallback: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) {
    return `${first} ${last.charAt(0).toLocaleUpperCase("tr-TR")}.`;
  }
  if (first) return first;
  const safe = fallback.trim();
  return safe || "Müşteri";
}

const CODE_SPACE = 36 ** 6;
const CODE_MULTIPLIER = 2_654_435_761;
const CODE_OFFSET = 1_093_742_219;

/**
 * Ekranda gösterilen ilan kodu. Sıra numarasını gizler: ardışık talepler
 * birbirine benzemeyen kodlar alır, kodlar çakışmaz (çarpan 36^6 ile aralarında asal).
 */
export function requestCode(id: number): string {
  const mixed = (BigInt(id) * BigInt(CODE_MULTIPLIER) + BigInt(CODE_OFFSET)) % BigInt(CODE_SPACE);
  return `SK-${mixed.toString(36).toUpperCase().padStart(6, "0")}`;
}

export type RequestTone = "green" | "yellow" | "blue" | "red" | "gray";

export const MAX_QUOTES = 4;

/** Müşterinin ilan listesinde gördüğü durum: renkli nokta + yazı. */
export function requestState(input: {
  status: string;
  quoteCount: number;
  expiresAt: Date;
  now?: number;
}): { tone: RequestTone; label: string; expired: boolean } {
  const expired =
    input.status === "expired" || input.status === "closed" || input.expiresAt.getTime() <= (input.now ?? Date.now());
  if (input.status === "closed") return { tone: "gray", label: "Kapatıldı", expired: true };
  if (input.status === "rejected") return { tone: "red", label: "Reddedildi", expired };
  if (input.status === "accepted") return { tone: "blue", label: "Teklif kabul edildi", expired };
  if (expired) return { tone: "gray", label: "Süresi doldu", expired };
  if (input.status === "pending") return { tone: "yellow", label: "İncelemede", expired };
  if (input.quoteCount >= MAX_QUOTES) return { tone: "blue", label: "Yeterli teklif geldi", expired };
  return { tone: "green", label: "Aktif", expired };
}

export function quoteStatusLabel(status: string) {
  if (status === "accepted") return "Kabul edildi";
  if (status === "rejected") return "Kabul edilmedi";
  return "Bekliyor";
}

/** Yazışma sadece teklif kabul edildiyse ya da ilan hâlâ açıkken bekleyen teklifte sürer. */
export function chatOpen(input: { quoteStatus: string; requestStatus: string; expiresAt: Date; now?: number }) {
  if (input.quoteStatus === "accepted") return true;
  return (
    input.quoteStatus === "pending" &&
    input.requestStatus === "open" &&
    input.expiresAt.getTime() > (input.now ?? Date.now())
  );
}

/** Hizmet verenin teklif listesinde gördüğü durum. */
export function providerQuoteLabel(input: { quoteStatus: string; requestStatus: string; expiresAt: Date }) {
  if (input.quoteStatus === "accepted") return "Kabul edildi";
  if (input.quoteStatus === "rejected") return "Kabul edilmedi";
  if (input.requestStatus === "closed") return "İlan kapatıldı";
  if (input.requestStatus === "rejected") return "İlan yayından kaldırıldı";
  if (input.requestStatus !== "open" || input.expiresAt.getTime() <= Date.now()) return "Süresi doldu";
  return "Yanıt bekleniyor";
}

export function clipText(value: string, max = 140): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/** Kart başlığı: "Matematik özel ders", "Python yazılım projesi". */
export function requestHeadline(
  slug: string,
  answers: { id: string; answer: string }[],
): string {
  const serviceName = getService(slug)?.name ?? "Hizmet";
  const byId = new Map(answers.map((answer) => [answer.id, answer.answer.trim()]));
  if (slug === "ozel-ders") {
    const subject = byId.get("okul-dersi") || byId.get("ders");
    if (subject) return `${subject} özel ders`;
  }
  if (slug === "yazilim-projesi") {
    const kind = byId.get("tur")?.split(",")[0]?.trim();
    if (kind && kind !== "Diğer") return kind;
    const lang = byId.get("uzmanlik");
    if (lang && lang !== "Tercihim yok" && lang !== "Diğer") return `${lang} yazılım projesi`;
  }
  const kind = byId.get("tur") || byId.get("islem") || byId.get("sorun");
  if (kind && kind.length <= 42) return `${serviceName}: ${kind}`;
  return serviceName;
}

/** Teklif sohbetinde gösterilen tek kanal. Diğer kanal dönmez. */
export function revealContact(
  channel: string | null | undefined,
  phone: string | null | undefined,
  email: string | null | undefined,
): { label: string; value: string } | null {
  if (channel === "phone") {
    const value = (phone ?? "").trim();
    return value ? { label: "Telefon", value } : null;
  }
  if (channel === "email") {
    const value = (email ?? "").trim();
    return value ? { label: "E-posta", value } : null;
  }
  return null;
}

export function formatPriceTl(amount: number): string {
  return `${new Intl.NumberFormat("tr-TR").format(amount)} TL`;
}

export function formatPlace(neighborhood: string, district: string, city: string): string {
  if (city === "Online") return "Online";
  return [neighborhood, district, city].filter(Boolean).join(", ");
}

export function formatWhen(timingType: string, scheduledAt: Date | null): string {
  if (timingType === "scheduled" && scheduledAt) {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(scheduledAt);
  }
  if (timingType === "two_months") return "İki ay içinde";
  if (timingType === "six_months") return "Altı ay içinde";
  return "Tarih belirtilmedi";
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}
