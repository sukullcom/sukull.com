import { getService, visibleQuestions, type ServiceQuestion } from "@/lib/marketplace/catalog";
import { addMonths } from "@/lib/marketplace/format";
import type { ServiceRequestAnswer } from "@/db/schema";

export type RequestDraft = {
  serviceSlug: string;
  answers: { id: string; answer: string }[];
  details: string;
  timing: "scheduled" | "two_months" | "six_months";
  scheduledAt?: string | null;
  contactChannel?: "phone" | "email";
  phone?: string | null;
};

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

function optionOk(question: ServiceQuestion, value: string): boolean {
  return (question.options ?? []).some((option) => option.value === value || option.label === value);
}

export function normalizeRequestAnswers(
  draft: RequestDraft,
): { ok: true; answers: ServiceRequestAnswer[] } | { ok: false; error: string } {
  const service = getService(draft.serviceSlug);
  if (!service) return { ok: false, error: "Bu hizmet bulunamadı." };

  const incoming = new Map(draft.answers.map((answer) => [answer.id, answer.answer.trim()]));
  const known: Record<string, string> = {};
  const stored: ServiceRequestAnswer[] = [];

  for (const question of service.questions) {
    if (question.when && !question.when(known)) continue;
    const raw = incoming.get(question.id) ?? "";
    if (question.kind === "text") {
      if (!raw) {
        if (question.optional) continue;
        return { ok: false, error: "Eksik bir cevap var." };
      }
      if (raw.length > 1000) return { ok: false, error: "Cevap çok uzun." };
      known[question.id] = raw;
      stored.push({ id: question.id, prompt: question.prompt, answer: raw });
      continue;
    }
    if (question.kind === "multi") {
      const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
      if (parts.length === 0 || !parts.every((part) => optionOk(question, part))) {
        return { ok: false, error: "Seçeneklerden birini seç." };
      }
      const answer = parts.join(", ");
      known[question.id] = answer;
      stored.push({ id: question.id, prompt: question.prompt, answer });
      continue;
    }
    if (!raw || !optionOk(question, raw)) {
      return { ok: false, error: "Seçeneklerden birini seç." };
    }
    known[question.id] = raw;
    stored.push({ id: question.id, prompt: question.prompt, answer: raw });
  }

  if (visibleQuestions(service, known).some((question) => question.kind !== "text" && !known[question.id])) {
    return { ok: false, error: "Eksik bir cevap var." };
  }

  return { ok: true, answers: stored };
}

/** Online seçildiyse il, ilçe ve mahalle sorulmaz. */
export function requestNeedsPlace(slug: string, answers: { id: string; answer: string }[]): boolean {
  if (!slug) return true;
  const how = answers.find((answer) => answer.id === "nasil")?.answer.trim() ?? "";
  if (how === "Online" || how.startsWith("Online ")) return false;
  return true;
}

export function resolveExpiry(
  timing: RequestDraft["timing"],
  scheduledAt: string | null | undefined,
  now = new Date(),
): { ok: true; scheduledAt: Date | null; expiresAt: Date } | { ok: false; error: string } {
  if (timing === "two_months") {
    return { ok: true, scheduledAt: null, expiresAt: addMonths(now, 2) };
  }
  if (timing === "six_months") {
    return { ok: true, scheduledAt: null, expiresAt: addMonths(now, 6) };
  }
  if (timing !== "scheduled" || !scheduledAt) {
    return { ok: false, error: "Tarih ve saat seç." };
  }
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) return { ok: false, error: "Tarih geçersiz." };
  if (when.getTime() < now.getTime() - 60_000) return { ok: false, error: "Geçmiş bir zaman seçilemez." };
  if (when.getTime() > now.getTime() + THREE_WEEKS_MS) {
    return { ok: false, error: "Belli bir zaman en fazla üç hafta sonrası olabilir." };
  }
  return { ok: true, scheduledAt: when, expiresAt: when };
}
