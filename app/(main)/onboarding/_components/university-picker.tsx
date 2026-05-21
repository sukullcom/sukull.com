"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";

import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/ui/searchable-combobox";
import { clientLogger } from "@/lib/client-logger";
import type { SelectedSchoolSummary } from "@/app/(main)/(protected)/profile/profile-school-selector";

type University = {
  id: number;
  name: string;
  city: string | null;
};

interface UniversityPickerProps {
  initialSchoolId?: number | null;
  onSelect: (schoolId: number, summary?: SelectedSchoolSummary) => void;
}

/**
 * Üniversite ve mezun yolundaki kullanıcılar için doğrudan üniversite
 * seçici. Şehir / ilçe adımlarını atlar; eğitmen başvurusunda da
 * kullandığımız `/api/schools?action=universities` katalog endpoint'ine
 * gider (24 saat agresif cache, tag-based invalidation).
 *
 * Liste alındıktan sonra arama tamamen istemci tarafında çalışıyor —
 * `SearchableCombobox` Türkçe locale ile diakritiklerden bağımsız
 * eşleşme yapar (`İstanbul` ≡ `istanbul` ≡ `istanbul universitesi`).
 *
 * Seçim yapıldığında `userProgress.schoolId` kaydı için **kanonik id**
 * döndürülür; aynı üniversitenin birden fazla satırı olsa (kampüs
 * ayrımı vb.) sunucu MIN(id) ile tek satıra normalize ediyor.
 */
export function UniversityPicker({
  initialSchoolId = null,
  onSelect,
}: UniversityPickerProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialSchoolId);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/schools?action=universities", {
          cache: "force-cache",
        });
        if (!res.ok) {
          throw new Error(`Üniversite listesi alınamadı (HTTP ${res.status})`);
        }
        const data = (await res.json()) as { universities: University[] };
        if (!active) return;
        setUniversities(data.universities ?? []);
      } catch (e) {
        if (!active) return;
        const msg =
          e instanceof Error ? e.message : "Üniversite listesi alınamadı";
        setError(msg);
        clientLogger.error({
          message: "load universities failed",
          location: "onboarding/UniversityPicker",
          fields: { detail: msg },
        });
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const options = useMemo<ComboboxOption[]>(
    () =>
      universities
        // Defansif: API yanıtında id eksikse (geçmişte Drizzle alias bug'ı
        // nedeniyle olmuştu) o satırı listeye HİÇ dahil etme — kullanıcı
        // bozuk satıra tıklayıp "undefined" commit etmesin.
        .filter(
          (u): u is University =>
            u != null &&
            typeof u.id === "number" &&
            Number.isFinite(u.id) &&
            u.id > 0 &&
            typeof u.name === "string" &&
            u.name.length > 0,
        )
        .map((u) => ({
          value: String(u.id),
          label: u.name,
          hint: u.city ?? undefined,
        })),
    [universities],
  );

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" /> Üniversite
      </label>
      <SearchableCombobox
        options={options}
        value={selectedId != null ? String(selectedId) : null}
        onChange={(v) => {
          // Production'da da fire — kullanıcı DevTools'tan kolayca
          // paylaşabilsin. Tanı amaçlı; kalıcı log değil.
          // eslint-disable-next-line no-console
          console.log("[uni-picker] onChange received", {
            v,
            type: typeof v,
            universitiesCount: universities.length,
          });
          if (v == null) {
            setSelectedId(null);
            return;
          }
          const id = Number(v);
          if (!Number.isFinite(id) || id <= 0) {
            // eslint-disable-next-line no-console
            console.warn("[uni-picker] invalid id, bailing", { v, id });
            clientLogger.error({
              message: "university picker received non-numeric value",
              location: "onboarding/UniversityPicker",
              fields: { received: String(v) },
            });
            return;
          }
          const hit = universities.find((u) => u.id === id);
          // eslint-disable-next-line no-console
          console.log("[uni-picker] applying selection", {
            id,
            hit: hit ? { id: hit.id, name: hit.name } : null,
          });
          // Yerel state'i HER zaman güncelle — combobox tetikleyici
          // buton yeni etiketi yansıtır, kullanıcı "tıklanmadı sanki"
          // hissi yaşamaz.
          setSelectedId(id);
          // Hit bulunamasa bile (cache/race kenar durumu) parent'a
          // gerçek bir özet geçiyoruz; aksi halde "Seçildi" kartı
          // görünmüyor ve form ilerlemiyordu.
          const summary: SelectedSchoolSummary = hit
            ? {
                id: hit.id,
                name: hit.name,
                city: hit.city ?? "",
                district: "Kampüs",
                category: "University",
              }
            : {
                id,
                name: `Üniversite (#${id})`,
                city: "",
                district: "Kampüs",
                category: "University",
              };
          onSelect(id, summary);
        }}
        isLoading={loading}
        placeholder="Üniversiteni seç"
        emptyText="Eşleşen üniversite yok"
        leftIcon={<Building2 className="h-4 w-4" />}
      />
      {error && (
        <p className="text-xs text-suk-warning-soft-fg">
          {error}. Daha sonra profilden ekleyebilirsin.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Mezun veya öğrenci olduğun üniversiteyi seç — puanların bu kuruma
        yazılır. İstersen aşağıdaki &ldquo;okul seçmeden devam et&rdquo;
        seçeneğiyle bu adımı atlayabilirsin; daha sonra profilden ekleyebilirsin.
      </p>
    </div>
  );
}
