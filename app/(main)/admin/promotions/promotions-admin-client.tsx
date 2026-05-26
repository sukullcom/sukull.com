"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  clearPromotionWinner,
  createPromotion,
  deletePromotion,
  pickPromotionWinner,
  togglePromotionActive,
  updatePromotion,
  PROMOTION_ACCENT_CHOICES,
  type AdminPromotionFormInput,
} from "@/actions/admin-promotions";
import {
  loadPromotionEntries,
  type AdminEntriesResult,
} from "./entries-action";
import type { PromotionAccent } from "@/lib/promotions";

interface AdminPromotionListItem {
  id: number;
  kind: string;
  title: string;
  description: string | null;
  prize: string;
  ctaLabel: string;
  rules: string | null;
  accentColor: PromotionAccent;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  winnerUserId: string | null;
  winnerPickedAt: string | null;
  createdAt: string;
  participantCount: number;
}

type Props = {
  initialPromotions: AdminPromotionListItem[];
};

const ACCENT_PREVIEW_CLASS: Record<PromotionAccent, string> = {
  violet: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
  amber: "bg-gradient-to-r from-amber-400 to-rose-500",
  rose: "bg-gradient-to-r from-rose-500 to-fuchsia-500",
  emerald: "bg-gradient-to-r from-emerald-500 to-cyan-500",
  sky: "bg-gradient-to-r from-sky-500 to-indigo-500",
};

const KIND_OPTIONS = [
  { value: "giveaway", label: "Çekiliş" },
  { value: "contest", label: "Yarışma" },
  { value: "announcement", label: "Duyuru" },
];

function toLocalInputValue(iso: string): string {
  // <input type="datetime-local"> needs `YYYY-MM-DDTHH:mm` in local time.
  // We rebuild from epoch to avoid TZ surprises on edit.
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  // `datetime-local` strings are interpreted as local time by `new Date`.
  // Round-trip to ISO so the server receives an unambiguous UTC stamp.
  if (!value) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : "";
}

function statusOf(promo: AdminPromotionListItem): {
  label: string;
  tone: "live" | "scheduled" | "ended" | "paused";
} {
  const now = Date.now();
  const start = new Date(promo.startsAt).getTime();
  const end = new Date(promo.endsAt).getTime();
  if (!promo.isActive) return { label: "Duraklatıldı", tone: "paused" };
  if (now < start) return { label: "Planlandı", tone: "scheduled" };
  if (now > end) return { label: "Bitti", tone: "ended" };
  return { label: "Yayında", tone: "live" };
}

const STATUS_TONE: Record<"live" | "scheduled" | "ended" | "paused", string> = {
  live: "bg-emerald-100 text-emerald-700 border-emerald-200",
  scheduled: "bg-sky-100 text-sky-700 border-sky-200",
  ended: "bg-muted text-muted-foreground border-border",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
};

const trFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PromotionsAdminClient({ initialPromotions }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminPromotionListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [entriesFor, setEntriesFor] = useState<AdminPromotionListItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const promotions = initialPromotions;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleToggleActive = useCallback(
    (promo: AdminPromotionListItem) => {
      setBusyId(promo.id);
      startTransition(async () => {
        const result = await togglePromotionActive(promo.id, !promo.isActive);
        setBusyId(null);
        if (!result.ok) {
          toast.error("Durum güncellenemedi");
          return;
        }
        toast.success(
          !promo.isActive ? "Çekiliş etkinleştirildi" : "Çekiliş duraklatıldı",
        );
        refresh();
      });
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (promo: AdminPromotionListItem) => {
      if (!confirm(`"${promo.title}" çekilişini silmek istediğine emin misin?`)) {
        return;
      }
      setBusyId(promo.id);
      startTransition(async () => {
        const result = await deletePromotion(promo.id);
        setBusyId(null);
        if (!result.ok) {
          toast.error("Silinemedi");
          return;
        }
        toast.success("Silindi");
        refresh();
      });
    },
    [refresh],
  );

  const handlePickWinner = useCallback(
    (promo: AdminPromotionListItem) => {
      const confirmMsg = promo.winnerUserId
        ? "Bu çekiliş için zaten bir kazanan seçilmiş. Yeniden çekmek istediğine emin misin?"
        : "Rastgele bir kazanan seçilecek. Devam edilsin mi?";
      if (!confirm(confirmMsg)) return;
      setBusyId(promo.id);
      startTransition(async () => {
        const result = await pickPromotionWinner(promo.id);
        setBusyId(null);
        if (!result.ok) {
          if (result.error === "no_entries") {
            toast.error("Hiç katılımcı yok");
          } else {
            toast.error("Kazanan seçilemedi");
          }
          return;
        }
        toast.success(
          `Kazanan: ${result.winnerName ?? result.winnerEmail ?? result.winnerUserId}`,
        );
        refresh();
      });
    },
    [refresh],
  );

  const handleClearWinner = useCallback(
    (promo: AdminPromotionListItem) => {
      if (!confirm("Kazanan kaydını sıfırlamak istediğine emin misin?")) return;
      setBusyId(promo.id);
      startTransition(async () => {
        const result = await clearPromotionWinner(promo.id);
        setBusyId(null);
        if (!result.ok) {
          toast.error("Sıfırlanamadı");
          return;
        }
        toast.success("Kazanan kaydı temizlendi");
        refresh();
      });
    },
    [refresh],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Toplam {promotions.length} kampanya
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreating(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Yeni çekiliş
          </Button>
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Henüz çekiliş oluşturmadın. &quot;Yeni çekiliş&quot; ile başlayabilirsin.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {promotions.map((promo) => {
            const status = statusOf(promo);
            return (
              <li
                key={promo.id}
                className="rounded-2xl border-2 border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-block h-3 w-8 rounded-full",
                          ACCENT_PREVIEW_CLASS[promo.accentColor],
                        )}
                        aria-hidden
                      />
                      <h3 className="text-base font-bold text-foreground">
                        {promo.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          STATUS_TONE[status.tone],
                        )}
                      >
                        {status.label}
                      </span>
                      {promo.kind !== "giveaway" && (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {promo.kind}
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Ödül:
                      </span>{" "}
                      {promo.prize}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {trFormatter.format(new Date(promo.startsAt))} →{" "}
                        {trFormatter.format(new Date(promo.endsAt))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {promo.participantCount.toLocaleString("tr-TR")} katılımcı
                      </span>
                      {promo.winnerUserId && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Trophy className="h-3.5 w-3.5" />
                          Kazanan belirlendi
                          {promo.winnerPickedAt
                            ? ` · ${trFormatter.format(new Date(promo.winnerPickedAt))}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEntriesFor(promo)}
                      className="gap-1.5"
                    >
                      <Users className="h-4 w-4" />
                      Katılımcılar
                    </Button>
                    <Button
                      type="button"
                      variant="warning"
                      size="sm"
                      onClick={() => handlePickWinner(promo)}
                      disabled={busyId === promo.id && isPending}
                      className="gap-1.5"
                    >
                      {busyId === promo.id && isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trophy className="h-4 w-4" />
                      )}
                      {promo.winnerUserId ? "Yeniden seç" : "Kazanan seç"}
                    </Button>
                    {promo.winnerUserId && (
                      <Button
                        type="button"
                        variant="dangerOutline"
                        size="sm"
                        onClick={() => handleClearWinner(promo)}
                        disabled={busyId === promo.id && isPending}
                        className="gap-1.5"
                        title="Kazanan kaydını sıfırla"
                      >
                        <X className="h-4 w-4" />
                        Sıfırla
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(promo)}
                      disabled={busyId === promo.id && isPending}
                      className="gap-1.5"
                    >
                      {promo.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Duraklat
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Aktifleştir
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(promo)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="dangerOutline"
                      size="sm"
                      onClick={() => handleDelete(promo)}
                      disabled={busyId === promo.id && isPending}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <PromotionFormDialog
          open
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <PromotionFormDialog
          open
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {entriesFor && (
        <EntriesDialog
          promotion={entriesFor}
          onClose={() => setEntriesFor(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Form dialog
// =============================================================================

interface FormState {
  kind: string;
  title: string;
  description: string;
  prize: string;
  ctaLabel: string;
  rules: string;
  accentColor: PromotionAccent;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

function buildInitial(item?: AdminPromotionListItem): FormState {
  if (!item) {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60_000);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      kind: "giveaway",
      title: "",
      description: "",
      prize: "",
      ctaLabel: "Çekilişe Katıl",
      rules: "",
      accentColor: "violet",
      imageUrl: "",
      startsAt: toLocalInputValue(start.toISOString()),
      endsAt: toLocalInputValue(end.toISOString()),
      isActive: true,
    };
  }
  return {
    kind: item.kind,
    title: item.title,
    description: item.description ?? "",
    prize: item.prize,
    ctaLabel: item.ctaLabel,
    rules: item.rules ?? "",
    accentColor: item.accentColor,
    imageUrl: item.imageUrl ?? "",
    startsAt: toLocalInputValue(item.startsAt),
    endsAt: toLocalInputValue(item.endsAt),
    isActive: item.isActive,
  };
}

function PromotionFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: AdminPromotionListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, setState] = useState<FormState>(() => buildInitial(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      setFieldErrors({});

      const payload: AdminPromotionFormInput = {
        kind: state.kind,
        title: state.title,
        description: state.description,
        prize: state.prize,
        ctaLabel: state.ctaLabel,
        rules: state.rules,
        accentColor: state.accentColor,
        imageUrl: state.imageUrl,
        startsAt: localInputToIso(state.startsAt),
        endsAt: localInputToIso(state.endsAt),
        isActive: state.isActive,
      };

      try {
        const result =
          mode === "create"
            ? await createPromotion(payload)
            : await updatePromotion(initial!.id, payload);

        if (!result.ok) {
          if (result.error === "validation" && result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
            toast.error("Lütfen alanları kontrol et");
          } else if (result.error === "unauthorized") {
            toast.error("Yetki gerekiyor");
          } else {
            toast.error("Kaydedilemedi");
          }
          return;
        }

        toast.success(mode === "create" ? "Çekiliş oluşturuldu" : "Güncellendi");
        onSaved();
      } finally {
        setSubmitting(false);
      }
    },
    [initial, mode, onSaved, state],
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Yeni çekiliş" : "Çekilişi düzenle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Başlık"
              error={fieldErrors.title}
              required
            >
              <Input
                value={state.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Örn. 7. Sınıf Matematik Çekilişi"
                maxLength={120}
                required
              />
            </Field>

            <Field label="Tür" error={fieldErrors.kind}>
              <Select
                value={state.kind}
                onValueChange={(value) => update("kind", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Ödül"
              error={fieldErrors.prize}
              required
              className="sm:col-span-2"
            >
              <Input
                value={state.prize}
                onChange={(e) => update("prize", e.target.value)}
                placeholder="Örn. 500 puan + grafik tablet"
                maxLength={200}
                required
              />
            </Field>

            <Field
              label="Açıklama"
              error={fieldErrors.description}
              className="sm:col-span-2"
            >
              <Textarea
                value={state.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Banner'da kısa açıklama"
                rows={2}
                maxLength={2000}
              />
            </Field>

            <Field label="Buton yazısı" error={fieldErrors.ctaLabel}>
              <Input
                value={state.ctaLabel}
                onChange={(e) => update("ctaLabel", e.target.value)}
                placeholder="Çekilişe Katıl"
                maxLength={60}
              />
            </Field>

            <Field label="Renk teması" error={fieldErrors.accentColor}>
              <Select
                value={state.accentColor}
                onValueChange={(value) =>
                  update("accentColor", value as PromotionAccent)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMOTION_ACCENT_CHOICES.map((accent) => (
                    <SelectItem key={accent} value={accent}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-3 w-6 rounded-full",
                            ACCENT_PREVIEW_CLASS[accent],
                          )}
                        />
                        {accent}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Başlangıç (yerel saat)"
              error={fieldErrors.startsAt}
              required
            >
              <Input
                type="datetime-local"
                value={state.startsAt}
                onChange={(e) => update("startsAt", e.target.value)}
                required
              />
            </Field>

            <Field
              label="Bitiş (yerel saat)"
              error={fieldErrors.endsAt}
              required
            >
              <Input
                type="datetime-local"
                value={state.endsAt}
                onChange={(e) => update("endsAt", e.target.value)}
                required
              />
            </Field>

            <Field
              label="Görsel URL (opsiyonel)"
              error={fieldErrors.imageUrl}
              className="sm:col-span-2"
            >
              <Input
                value={state.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
                placeholder="/gift.svg veya https://..."
                maxLength={500}
              />
            </Field>

            <Field
              label="Kurallar (opsiyonel)"
              error={fieldErrors.rules}
              className="sm:col-span-2"
            >
              <Textarea
                value={state.rules}
                onChange={(e) => update("rules", e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Katılım koşulları, çekiliş yöntemi vb."
              />
            </Field>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="promotion-is-active"
                type="checkbox"
                checked={state.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="promotion-is-active" className="cursor-pointer">
                Aktif (banner gösterilsin)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gift className="h-4 w-4" />
              )}
              {mode === "create" ? "Oluştur" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// =============================================================================
// Entries dialog
// =============================================================================

function EntriesDialog({
  promotion,
  onClose,
}: {
  promotion: AdminPromotionListItem;
  onClose: () => void;
}) {
  const [state, setState] = useState<AdminEntriesResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadPromotionEntries(promotion.id);
      setState(result);
    } finally {
      setLoading(false);
    }
  }, [promotion.id]);

  // Lazy fetch on first render; subsequent refreshes are user-triggered.
  useEffect(() => {
    void load();
  }, [load]);

  const entries = state?.ok ? state.entries ?? [] : [];

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{promotion.title} — Katılımcılar</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Toplam {promotion.participantCount.toLocaleString("tr-TR")} kişi katıldı
            {entries.length === 500 && " (ilk 500 gösteriliyor)"}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Yenile
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border">
          {loading && entries.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Henüz katılımcı yok.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Kullanıcı</th>
                  <th className="px-3 py-2">E-posta</th>
                  <th className="px-3 py-2">Katılım</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const isWinner = promotion.winnerUserId === entry.userId;
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-t border-border",
                        isWinner && "bg-emerald-50/60",
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          {entry.userName ?? entry.userId.slice(0, 8)}
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Trophy className="h-3 w-3" /> Kazanan
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {entry.userEmail ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {trFormatter.format(new Date(entry.createdAt))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
