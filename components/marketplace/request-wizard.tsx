"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createServiceRequest } from "@/actions/marketplace";
import { trackMarketplace } from "@/lib/marketplace/track";
import { LocationFields } from "@/components/marketplace/location-fields";
import { Button } from "@/components/ui/button";
import type { Province } from "@/lib/marketplace/address";
import { getService, visibleQuestions, type ServiceQuestion } from "@/lib/marketplace/catalog";
import { requestNeedsPlace, type RequestDraft } from "@/lib/marketplace/validate-request";

function mobileReady(raw: string): boolean {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^5\d{9}$/.test(digits);
}

type Step =
  | { key: string; kind: "question"; question: ServiceQuestion }
  | { key: "details"; kind: "details" }
  | { key: "where"; kind: "where" }
  | { key: "when"; kind: "when" }
  | { key: "contact"; kind: "contact" };

export function RequestWizard({
  slug,
  provinces,
  email,
  phone,
  preset = {},
}: {
  slug: string;
  provinces: Province[];
  email: string;
  phone: string;
  preset?: Record<string, string>;
}) {
  const router = useRouter();
  const service = getService(slug);
  const [answers, setAnswers] = useState<Record<string, string>>(preset);
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [details, setDetails] = useState("");
  const [place, setPlace] = useState<{ provinceId: number | null; districtId: number | null; neighborhood: string }>({
    provinceId: null,
    districtId: null,
    neighborhood: "",
  });
  const [timing, setTiming] = useState<RequestDraft["timing"] | "">("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [contact, setContact] = useState<"phone" | "email" | "">("");
  const [phoneInput, setPhoneInput] = useState(phone.replace(/^\+90/, ""));
  const [index, setIndex] = useState(() => {
    if (!service) return 0;
    const first = visibleQuestions(service, preset).findIndex((question) => !preset[question.id]);
    return first < 0 ? visibleQuestions(service, preset).length : first;
  });
  const [pending, setPending] = useState(false);

  const steps = useMemo<Step[]>(() => {
    if (!service) return [{ key: "details", kind: "details" }];
    const questions = visibleQuestions(service, answers).map((question) => ({
      key: question.id,
      kind: "question" as const,
      question,
    }));
    const placeNeeded = requestNeedsPlace(
      service.slug,
      Object.entries(answers).map(([id, answer]) => ({ id, answer })),
    );
    return [
      ...questions,
      { key: "details", kind: "details" },
      ...(placeNeeded ? [{ key: "where" as const, kind: "where" as const }] : []),
      { key: "when", kind: "when" },
      { key: "contact", kind: "contact" },
    ];
  }, [service, answers]);

  if (!service) return null;

  const step = steps[Math.min(index, steps.length - 1)];
  const progress = Math.round(((Math.min(index, steps.length - 1) + 1) / steps.length) * 100);

  function currentAnswer(question: ServiceQuestion): string {
    if (question.kind === "multi") return (multi[question.id] ?? []).join(", ");
    return answers[question.id] ?? "";
  }

  function stepReady(): boolean {
    if (step.kind === "question") {
      const question = step.question;
      if (question.kind === "text") return question.optional || (answers[question.id] ?? "").trim().length > 0;
      if (question.kind === "multi") return (multi[question.id] ?? []).length > 0;
      return Boolean(answers[question.id]);
    }
    if (step.kind === "details") return details.trim().length >= 10;
    if (step.kind === "where") return Boolean(place.provinceId && place.districtId && place.neighborhood);
    if (step.kind === "when") {
      if (!timing) return false;
      if (timing === "scheduled") return Boolean(scheduledAt);
      return true;
    }
    if (step.kind === "contact") {
      if (contact === "email") return Boolean(email.trim());
      if (contact === "phone") return mobileReady(phoneInput);
      return false;
    }
    return false;
  }

  async function next() {
    if (!service) return;
    if (!stepReady()) {
      toast.error("Bu adımı tamamla.");
      return;
    }
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (!timing) return;
    const payloadAnswers = visibleQuestions(service, answers).map((question) => ({
      id: question.id,
      answer: currentAnswer(question),
    }));
    const placeNeeded = requestNeedsPlace(service.slug, payloadAnswers);
    if (placeNeeded && (!place.provinceId || !place.districtId)) return;
    if (contact !== "phone" && contact !== "email") return;
    setPending(true);
    const result = await createServiceRequest({
      serviceSlug: service.slug,
      answers: payloadAnswers,
      details,
      provinceId: placeNeeded ? place.provinceId! : 0,
      districtId: placeNeeded ? place.districtId! : 0,
      neighborhood: placeNeeded ? place.neighborhood : "",
      timing,
      scheduledAt: timing === "scheduled" ? new Date(scheduledAt).toISOString() : null,
      contactChannel: contact,
      phone: contact === "phone" ? phoneInput : null,
    });
    setPending(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    trackMarketplace("ilan_gonderildi", { hizmet: service.slug });
    router.push(`/islerim/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{service.name}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-suk-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step.kind === "question" && (
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold text-foreground">{step.question.prompt}</legend>
          {step.question.kind === "multi" && (
            <p className="text-sm text-muted-foreground">Birden fazla seçebilirsin.</p>
          )}
          {step.question.kind === "text" ? (
            <textarea
              className="mk-input min-h-32"
              value={answers[step.question.id] ?? ""}
              onChange={(event) => setAnswers({ ...answers, [step.question.id]: event.target.value })}
            />
          ) : (
            <div className="grid gap-2">
              {(step.question.options ?? []).map((option) => {
                const selected =
                  step.question.kind === "multi"
                    ? (multi[step.question.id] ?? []).includes(option.value)
                    : answers[step.question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (step.question.kind === "multi") {
                        const current = multi[step.question.id] ?? [];
                        const nextValues = current.includes(option.value)
                          ? current.filter((value) => value !== option.value)
                          : [...current, option.value];
                        setMulti({ ...multi, [step.question.id]: nextValues });
                        setAnswers({ ...answers, [step.question.id]: nextValues.join(", ") });
                      } else {
                        setAnswers({ ...answers, [step.question.id]: option.value });
                      }
                    }}
                    className={`mk-option ${selected ? "mk-option-on" : ""}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {step.kind === "details" && (
        <label className="block space-y-2">
          <span className="text-xl font-bold text-foreground">İhtiyacın detayları neler?</span>
          <textarea
            className="mk-input min-h-36"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Hizmet verenin teklif verebilmesi için kısaca anlat."
          />
        </label>
      )}

      {step.kind === "where" && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Nerede?</h2>
          <LocationFields provinces={provinces} {...place} onChange={setPlace} />
        </div>
      )}

      {step.kind === "contact" && (
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold text-foreground">Teklif veren seni nasıl ulaşsın?</legend>
          <p className="text-sm text-muted-foreground">
            Bu bilgi ilanda görünmez. Yalnızca bu ilana teklif veren kişi sohbette görür. Birini seç.
          </p>
          {(
            [
              ["phone", "Telefon"],
              ["email", "E-posta"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setContact(value)}
              className={`mk-option ${contact === value ? "mk-option-on" : ""}`}
            >
              {label}
            </button>
          ))}
          {contact === "phone" && (
            <label className="block space-y-1 text-sm font-semibold">
              Cep telefonu
              <input
                inputMode="numeric"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="5xx xxx xx xx"
                className="mk-input font-normal"
              />
            </label>
          )}
          {contact === "email" && (
            <p className="mk-card px-4 py-3 text-sm">{email}</p>
          )}
        </fieldset>
      )}

      {step.kind === "when" && (
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold text-foreground">Ne zaman?</legend>
          {(
            [
              ["scheduled", "Belli bir zaman (üç hafta içinde)"],
              ["two_months", "İki ay içinde"],
              ["six_months", "Altı ay içinde"],
              ["price_check", "Sadece fiyat bakıyorum"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTiming(value)}
              className={`mk-option ${timing === value ? "mk-option-on" : ""}`}
            >
              {label}
            </button>
          ))}
          {timing === "scheduled" && (
            <input
              type="datetime-local"
              className="mk-input"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          )}
        </fieldset>
      )}

      <div className="flex gap-2">
        {index > 0 && (
          <Button type="button" variant="secondaryOutline" className="flex-1" onClick={() => setIndex(index - 1)}>
            Geri
          </Button>
        )}
        <Button type="button" variant="primary" className="flex-1" disabled={pending} onClick={next}>
          {index === steps.length - 1 ? (pending ? "Gönderiliyor…" : "Talebi gönder") : "Devam"}
        </Button>
      </div>
    </div>
  );
}
