"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Building2,
  Monitor,
  BookOpen,
} from "lucide-react";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/ui/searchable-combobox";

const LESSON_MODES: { value: string; label: string }[] = [
  { value: "", label: "Tüm ders tipleri" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "Yüz yüze" },
];

interface Props {
  initialQuery: string;
  initialField: string;
  initialLessonMode: string;
  initialCity: string;
  initialUniversity: string;
  resultCount: number;
  totalCount: number;
}

/**
 * Eğitmen rehberi arama & filtre paneli. Tasarım hedefleri:
 *
 *  - **Tek satırlık serbest arama**: kullanıcının "matematik istanbul" yazıp
 *    Enter'a bastığında her iki token da en az bir alanda eşleşsin.
 *  - **Açılabilir gelişmiş filtreler**: üniversite (combobox), şehir,
 *    branş, ders modu. Mobilde varsayılan kapalı — chip'ler aktif filtreyi
 *    gösterir.
 *  - **Büyük/küçük harf duyarsız**: tüm karşılaştırma server'da
 *    `normalizeForSearch` ile yapılıyor; bu bileşen sadece URL'i güncelliyor.
 *
 * Filtreler URL search params'a yazılıyor (`?q=&field=&...`) — paylaşılabilir,
 * geri butonu çalışır, server-component'ler tek doğruluk kaynağı olur.
 */
export function TeachersDirectoryFilters({
  initialQuery,
  initialField,
  initialLessonMode,
  initialCity,
  initialUniversity,
  resultCount,
  totalCount,
}: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [field, setField] = useState(initialField);
  const [lessonMode, setLessonMode] = useState(initialLessonMode);
  const [city, setCity] = useState(initialCity);
  const [university, setUniversity] = useState(initialUniversity);

  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(initialField || initialLessonMode || initialCity || initialUniversity),
  );

  const [universities, setUniversities] = useState<ComboboxOption[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [cities, setCities] = useState<ComboboxOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  // Üniversite ve şehir katalogları — `force-cache` ile aynı sekmede tek
  // istek; `/api/schools` 24h TTL ile sunuyor. Sayfa state'ini reset etmesin
  // diye unmount korumalı.
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let active = true;

    const loadUniversities = async () => {
      try {
        // CDN cache bust: bkz. UniversityPicker — alias düzeltmesinden
        // önce cache'lenmiş kırık yanıt yüzünden `v=3`.
        const r = await fetch("/api/schools?action=universities&v=3", {
          cache: "force-cache",
        });
        if (!r.ok) throw new Error("fail");
        const data = (await r.json()) as {
          universities: Array<{ name: string; city: string | null }>;
        };
        if (!active) return;
        setUniversities(
          (data.universities ?? []).map((u) => ({
            value: u.name,
            label: u.name,
            hint: u.city ?? undefined,
          })),
        );
      } catch {
        // Combobox `allowFreeText` ile çalışmaya devam eder.
      } finally {
        if (active) setUniversitiesLoading(false);
      }
    };

    const loadCities = async () => {
      try {
        const r = await fetch("/api/schools?action=cities", {
          cache: "force-cache",
        });
        if (!r.ok) throw new Error("fail");
        const data = (await r.json()) as {
          cities: Array<{ city: string }>;
        };
        if (!active) return;
        // Veritabanında şehirler büyük harfli (`İSTANBUL`); kullanıcıya
        // okunabilir "İstanbul" formatında göster.
        setCities(
          (data.cities ?? []).map((c) => ({
            value: c.city, // kaydedilen format
            label: toTitleTr(c.city), // gösterim
          })),
        );
      } catch {
        // şehir input'u serbest metin olarak çalışır.
      } finally {
        if (active) setCitiesLoading(false);
      }
    };

    Promise.all([loadUniversities(), loadCities()]);

    return () => {
      active = false;
    };
  }, []);

  const push = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v && v.length > 0) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => {
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    });
  };

  const submitQuery = () => push({ q: query.trim() });

  const clearAll = () => {
    setQuery("");
    setField("");
    setLessonMode("");
    setCity("");
    setUniversity("");
    startTransition(() => router.replace("?"));
  };

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: () => void }[] = [];
    if (query)
      out.push({
        key: "q",
        label: `"${query}"`,
        clear: () => {
          setQuery("");
          push({ q: "" });
        },
      });
    if (field)
      out.push({
        key: "field",
        label: `Branş: ${field}`,
        clear: () => {
          setField("");
          push({ field: "" });
        },
      });
    if (university)
      out.push({
        key: "university",
        label: `Üniversite: ${university}`,
        clear: () => {
          setUniversity("");
          push({ university: "" });
        },
      });
    if (city)
      out.push({
        key: "city",
        label: `Şehir: ${toTitleTr(city)}`,
        clear: () => {
          setCity("");
          push({ city: "" });
        },
      });
    if (lessonMode) {
      const lbl =
        LESSON_MODES.find((m) => m.value === lessonMode)?.label ?? lessonMode;
      out.push({
        key: "lessonMode",
        label: lbl,
        clear: () => {
          setLessonMode("");
          push({ lessonMode: "" });
        },
      });
    }
    return out;
    // push'u dependency'ye almıyoruz: closure olarak çalışıyor, her render
    // güncel state'i alacak yeni instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, field, city, university, lessonMode]);

  const anyActive = chips.length > 0;

  return (
    <section className="mb-4 rounded-xl border bg-card p-3 sm:p-4">
      {/* Üst satır: serbest arama + gelişmiş filtre toggle */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery();
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={submitQuery}
            placeholder="Ad, branş, şehir, üniversite ara..."
            aria-label="Eğitmen ara"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-suk-brand focus:ring-1 focus:ring-suk-brand/20"
          />
        </form>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-muted/50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Gelişmiş
        </button>
      </div>

      {/* Aktif filtre özetleri */}
      {anyActive && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full bg-suk-brand-soft px-2 py-0.5 text-[11px] font-medium text-suk-brand-border hover:bg-suk-brand-soft/80"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Tümünü temizle
          </button>
        </div>
      )}

      {/* Gelişmiş filtreler */}
      {showAdvanced && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Üniversite
            </label>
            <SearchableCombobox
              options={universities}
              value={university || null}
              onChange={(v) => {
                setUniversity(v ?? "");
                push({ university: v ?? "" });
              }}
              isLoading={universitiesLoading}
              placeholder="Üniversite seç"
              emptyText="Eşleşen üniversite yok"
              leftIcon={<Building2 className="h-3.5 w-3.5" />}
              allowFreeText
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Şehir
            </label>
            <SearchableCombobox
              options={cities}
              value={city || null}
              onChange={(v) => {
                setCity(v ?? "");
                push({ city: v ?? "" });
              }}
              isLoading={citiesLoading}
              placeholder="Şehir seç"
              emptyText="Eşleşen şehir yok"
              leftIcon={<MapPin className="h-3.5 w-3.5" />}
              allowFreeText
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Branş
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                onBlur={() => push({ field })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    push({ field });
                  }
                }}
                placeholder="örn. Matematik"
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-suk-brand focus:ring-1 focus:ring-suk-brand/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Monitor className="h-3.5 w-3.5" /> Ders tipi
            </label>
            <div className="flex gap-1.5">
              {LESSON_MODES.map((m) => {
                const active = lessonMode === m.value;
                return (
                  <button
                    key={m.value || "all"}
                    type="button"
                    onClick={() => {
                      setLessonMode(m.value);
                      push({ lessonMode: m.value });
                    }}
                    className={
                      "flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors " +
                      (active
                        ? "border-suk-brand bg-suk-brand-soft text-suk-brand-border"
                        : "text-muted-foreground hover:bg-muted/50")
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sonuç sayacı */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {resultCount} / {totalCount} eğitmen
        </span>
        {anyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="hidden sm:inline-flex items-center gap-1 hover:text-foreground"
          >
            <X className="h-3 w-3" /> Filtreleri temizle
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * Türkçe başlık-kalıp dönüşümü. `İSTANBUL` → `İstanbul`, `ÇANAKKALE` →
 * `Çanakkale`. Sadece görsel amaçlı; kaydedilen veriyi değiştirmez.
 */
function toTitleTr(input: string): string {
  if (!input) return "";
  return input
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((w) =>
      w.length > 0
        ? w[0].toLocaleUpperCase("tr-TR") + w.slice(1)
        : w,
    )
    .join(" ");
}
