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
      universities.map((u) => ({
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
          if (v == null) {
            setSelectedId(null);
            return;
          }
          const id = Number(v);
          if (!Number.isFinite(id)) return;
          const hit = universities.find((u) => u.id === id);
          setSelectedId(id);
          onSelect(id, hit
            ? {
                id: hit.id,
                name: hit.name,
                city: hit.city ?? "",
                district: "Kampüs",
                category: "University",
              }
            : undefined);
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
