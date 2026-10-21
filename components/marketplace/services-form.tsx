"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Minus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { saveProviderServices } from "@/actions/marketplace-account";
import { CategoryTiles } from "@/components/marketplace/category-tiles";
import { CATEGORIES, SERVICES, getService, type ServiceDef } from "@/lib/marketplace/catalog";
import { serviceVariants, variantMatchesQuery, type ProviderServiceEntry } from "@/lib/marketplace/provider-match";
import { normalizeTr, searchServices } from "@/lib/marketplace/search";
import { cn } from "@/lib/utils";

type TickState = "on" | "off" | "some";
type SaveState = "idle" | "saving" | "saved";
type SearchRow = { key: string; service: ServiceDef; variant?: string };

const SERVICE_ORDER = new Map(SERVICES.map((service, index) => [service.slug, index]));

function sortEntries(entries: ProviderServiceEntry[]) {
  return [...entries].sort((a, b) => (SERVICE_ORDER.get(a.slug) ?? 0) - (SERVICE_ORDER.get(b.slug) ?? 0));
}

/** Seçili çeşitler; "tümü" seçiliyse hepsi. */
function chosenVariants(entry: ProviderServiceEntry | undefined, values: string[]): string[] {
  if (!entry) return [];
  const list = entry.filters.variants ?? [];
  return list.length > 0 ? list : values;
}

function entrySubtitle(entry: ProviderServiceEntry): string | null {
  const variants = serviceVariants(entry.slug);
  if (!variants) return null;
  const list = entry.filters.variants ?? [];
  if (list.length === 0) return variants.allLabel;
  return list.length > 5 ? `${list.slice(0, 4).join(", ")} ve ${list.length - 4} tane daha` : list.join(", ");
}

export function ServicesForm({ selected }: { selected: ProviderServiceEntry[] }) {
  const [entries, setEntries] = useState(() => sortEntries(selected));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const latest = useRef(entries);
  const saved = useRef(entries);
  const saving = useRef(false);
  const dirty = useRef(false);
  const addSection = useRef<HTMLElement>(null);
  const anchor = useRef<{ element: HTMLElement; top: number } | null>(null);

  // Üstteki liste büyüyüp küçülünce dokunulan satır parmağın altında kalsın.
  useLayoutEffect(() => {
    const kept = anchor.current;
    anchor.current = null;
    if (!kept || !kept.element.isConnected) return;
    const delta = kept.element.getBoundingClientRect().top - kept.top;
    if (delta !== 0) window.scrollBy(0, delta);
  }, [entries]);

  function keepInPlace(element: HTMLElement) {
    anchor.current = { element, top: element.getBoundingClientRect().top };
  }

  const bySlug = useMemo(() => new Map(entries.map((entry) => [entry.slug, entry])), [entries]);
  const badges = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      const service = getService(entry.slug);
      if (service) counts[service.categorySlug] = (counts[service.categorySlug] ?? 0) + 1;
    }
    return counts;
  }, [entries]);
  const searchRows = useMemo(() => buildSearchRows(query), [query]);

  async function flush() {
    if (saving.current) {
      dirty.current = true;
      return;
    }
    saving.current = true;
    setSaveState("saving");
    let ok = true;
    do {
      dirty.current = false;
      const snapshot = latest.current;
      const result = await saveProviderServices(snapshot);
      if ("error" in result && result.error) {
        ok = false;
        toast.error(result.error);
        latest.current = saved.current;
        setEntries(saved.current);
        break;
      }
      saved.current = snapshot;
    } while (dirty.current);
    saving.current = false;
    setSaveState(ok ? "saved" : "idle");
  }

  function commit(next: ProviderServiceEntry[]) {
    const sorted = sortEntries(next);
    latest.current = sorted;
    setEntries(sorted);
    void flush();
  }

  function setEntry(slug: string, variants: string[] | null) {
    const rest = latest.current.filter((entry) => entry.slug !== slug);
    commit(variants === null ? rest : [...rest, { slug, filters: variants.length > 0 ? { variants } : {} }]);
  }

  function remove(slug: string) {
    const before = latest.current;
    const name = getService(slug)?.name ?? "Hizmet";
    setEntry(slug, null);
    toast(`${name} kaldırıldı`, { action: { label: "Geri al", onClick: () => commit(before) } });
  }

  function toggleService(slug: string) {
    if (bySlug.has(slug)) remove(slug);
    else setEntry(slug, []);
  }

  function updateVariants(slug: string, change: (current: Set<string>) => void) {
    const variants = serviceVariants(slug);
    if (!variants) return;
    const current = new Set(chosenVariants(bySlug.get(slug), variants.values));
    change(current);
    const next = variants.values.filter((item) => current.has(item));
    if (next.length === 0) setEntry(slug, null);
    else setEntry(slug, next.length === variants.values.length ? [] : next);
  }

  function toggleVariant(slug: string, value: string) {
    updateVariants(slug, (current) => {
      if (current.has(value)) current.delete(value);
      else current.add(value);
    });
  }

  function toggleGroup(slug: string, values: string[]) {
    updateVariants(slug, (current) => {
      const all = values.every((value) => current.has(value));
      for (const value of values) {
        if (all) current.delete(value);
        else current.add(value);
      }
    });
  }

  function flipGroup(key: string) {
    setOpenGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll(slug: string) {
    const entry = bySlug.get(slug);
    const isAll = entry && (entry.filters.variants ?? []).length === 0;
    setEntry(slug, isAll ? null : []);
  }

  function variantState(slug: string): TickState {
    const entry = bySlug.get(slug);
    if (!entry) return "off";
    return (entry.filters.variants ?? []).length === 0 ? "on" : "some";
  }

  function openCategory(slug: string, expand: string | null = null) {
    setQuery("");
    setCategory(slug);
    setExpanded(expand);
    requestAnimationFrame(() => {
      const top = addSection.current?.getBoundingClientRect().top ?? 0;
      if (top < 0 || top > window.innerHeight * 0.6) {
        addSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const categoryDef = CATEGORIES.find((item) => item.slug === category);

  function renderService(service: ServiceDef) {
    const variants = serviceVariants(service.slug);
    if (!variants) {
      return (
        <TickRow
          key={service.slug}
          label={service.name}
          state={bySlug.has(service.slug) ? "on" : "off"}
          onToggle={(element) => {
            keepInPlace(element);
            toggleService(service.slug);
          }}
        />
      );
    }
    const entry = bySlug.get(service.slug);
    const chosen = chosenVariants(entry, variants.values);
    const isOpen = expanded === service.slug;
    const state = variantState(service.slug);
    return (
      <div
        key={service.slug}
        className={cn(
          "overflow-hidden rounded-2xl border-2 border-b-4 transition-colors",
          entry ? "border-suk-brand/40" : "border-border",
        )}
      >
        <div className={cn("flex items-center", entry && "bg-suk-brand-soft/50")}>
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setExpanded(isOpen ? null : service.slug)}
            className="flex min-h-14 flex-1 items-center gap-2 px-4 py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{service.name}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {entry ? entrySubtitle(entry) : variants.pickLabel}
              </span>
            </span>
            <ChevronDown
              className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          <button
            type="button"
            role="checkbox"
            aria-checked={state === "on" ? true : state === "some" ? "mixed" : false}
            aria-label={`${service.name}: ${variants.allLabel}`}
            onClick={(event) => {
              keepInPlace(event.currentTarget);
              toggleAll(service.slug);
            }}
            className="flex h-14 w-14 shrink-0 items-center justify-center"
          >
            <Tick state={state} />
          </button>
        </div>
        {isOpen && (
          <div className="space-y-2 border-t-2 border-border bg-background p-2">
            <TickRow
              compact
              label={variants.allLabel}
              state={state === "on" ? "on" : "off"}
              onToggle={(element) => {
                keepInPlace(element);
                toggleAll(service.slug);
              }}
            />
            {variants.groups.map((group) => {
              const items = (
                <div className="grid gap-1 sm:grid-cols-2">
                  {group.values.map((value) => (
                    <TickRow
                      key={value}
                      compact
                      label={value}
                      state={chosen.includes(value) ? "on" : "off"}
                      onToggle={(element) => {
                        keepInPlace(element);
                        toggleVariant(service.slug, value);
                      }}
                    />
                  ))}
                </div>
              );
              if (!group.title) return <div key="all">{items}</div>;
              const key = `${service.slug}:${group.title}`;
              const picked = group.values.filter((value) => chosen.includes(value)).length;
              const groupOpen = openGroups.has(key);
              const groupState: TickState = picked === 0 ? "off" : picked === group.values.length ? "on" : "some";
              return (
                <div key={key} className="rounded-xl border-2 border-border">
                  <div className="flex items-center">
                    <button
                      type="button"
                      aria-expanded={groupOpen}
                      onClick={() => flipGroup(key)}
                      className="flex min-h-12 flex-1 items-center gap-2 px-3 py-2 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{group.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {picked > 0 ? `${picked} / ${group.values.length} seçili` : `${group.values.length} seçenek`}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", groupOpen && "rotate-180")}
                        aria-hidden
                      />
                    </button>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={groupState === "on" ? true : groupState === "some" ? "mixed" : false}
                      aria-label={`${group.title}: hepsini seç`}
                      onClick={(event) => {
                        keepInPlace(event.currentTarget);
                        toggleGroup(service.slug, group.values);
                      }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center"
                    >
                      <Tick state={groupState} />
                    </button>
                  </div>
                  {groupOpen && <div className="border-t-2 border-border p-1">{items}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-extrabold">Eklediğin hizmetler</h2>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">Sadece bu hizmetlerin ilanlarını görürsün.</p>
        {entries.length === 0 ? (
          <p className="mk-empty text-sm">Henüz hizmet eklemedin. Aşağıdan kategori seçip verdiğin hizmetleri işaretle.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const service = getService(entry.slug);
              if (!service) return null;
              const subtitle = entrySubtitle(entry);
              return (
                <li key={entry.slug} className="mk-card flex items-center gap-2 py-1 pl-4 pr-1">
                  <button
                    type="button"
                    onClick={() => openCategory(service.categorySlug, subtitle ? service.slug : null)}
                    className="min-w-0 flex-1 py-2.5 text-left"
                  >
                    <span className="block font-bold">{service.name}</span>
                    {subtitle && <span className="mt-0.5 block text-sm text-muted-foreground">{subtitle}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry.slug)}
                    aria-label={`${service.name} kaldır`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-suk-danger"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section ref={addSection} className="scroll-mt-20 [overflow-anchor:none]">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-extrabold">Hizmet ekle</h2>
          <span aria-live="polite" className="text-xs font-semibold text-muted-foreground">
            {saveState === "saving" ? "Kaydediliyor…" : saveState === "saved" ? "Kaydedildi" : ""}
          </span>
        </div>
        <div className="relative mb-4">
          <label className="sr-only" htmlFor="hizmet-ekle-ara">
            Hizmet ara
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="hizmet-ekle-ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hizmet ara: matematik, temizlik, tesisat"
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-b-4 border-border bg-card py-3.5 pl-12 pr-11 text-base outline-none transition-colors focus:border-suk-brand"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {query.trim() ? (
          <div className="space-y-5">
            {searchRows.length === 0 && <p className="mk-empty text-sm">Bu aramaya uyan hizmet yok.</p>}
            {CATEGORIES.map((item) => {
              const rows = searchRows.filter((row) => row.service.categorySlug === item.slug);
              if (rows.length === 0) return null;
              return (
                <div key={item.slug}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{item.name}</p>
                  <div className="space-y-2">
                    {rows.map((row) => {
                      if (!row.variant) return renderService(row.service);
                      const variants = serviceVariants(row.service.slug);
                      const chosen = chosenVariants(bySlug.get(row.service.slug), variants?.values ?? []);
                      return (
                        <TickRow
                          key={row.key}
                          label={variants?.label(row.variant) ?? row.variant}
                          state={chosen.includes(row.variant) ? "on" : "off"}
                          onToggle={(element) => {
                            keepInPlace(element);
                            toggleVariant(row.service.slug, row.variant as string);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : categoryDef ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                aria-label="Kategorilere dön"
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-border bg-card active:translate-y-[2px] active:border-b-2"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
              <h3 className="text-base font-extrabold">{categoryDef.name}</h3>
            </div>
            <div className="space-y-2">
              {SERVICES.filter((service) => service.categorySlug === categoryDef.slug).map(renderService)}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">Kategori seç, verdiğin hizmetleri işaretle.</p>
            <CategoryTiles onSelect={(slug) => openCategory(slug)} badges={badges} />
          </>
        )}
      </section>
    </div>
  );
}

function Tick({ state }: { state: TickState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        state === "off" ? "border-border bg-background" : "border-suk-brand bg-suk-brand text-suk-brand-fg",
      )}
    >
      {state === "on" && <Check className="h-4 w-4" strokeWidth={3} />}
      {state === "some" && <Minus className="h-4 w-4" strokeWidth={3} />}
    </span>
  );
}

function TickRow({
  label,
  hint,
  state,
  onToggle,
  compact = false,
}: {
  label: string;
  hint?: string;
  state: TickState;
  onToggle: (element: HTMLElement) => void;
  compact?: boolean;
}) {
  const on = state !== "off";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={(event) => onToggle(event.currentTarget)}
      className={cn(
        "flex w-full items-center justify-between gap-3 text-left transition-colors",
        compact
          ? "min-h-11 rounded-xl px-3 py-2 hover:bg-muted"
          : "min-h-14 rounded-2xl border-2 border-b-4 px-4 py-3 active:translate-y-[2px] active:border-b-2",
        !compact && (on ? "border-suk-brand/40 bg-suk-brand-soft/50" : "border-border bg-card hover:bg-muted/40"),
        compact && on && "font-semibold",
      )}
    >
      <span className="min-w-0">
        <span className={cn("block", !compact && "font-semibold")}>{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <Tick state={state} />
    </button>
  );
}

function buildSearchRows(query: string): SearchRow[] {
  const q = normalizeTr(query);
  if (!q) return [];
  const matched = new Set(searchServices(query, 60).map((service) => service.slug));
  const rows: SearchRow[] = [];
  for (const service of SERVICES) {
    const variants = serviceVariants(service.slug);
    const named =
      variants && !normalizeTr(service.name).includes(q)
        ? variants.values.filter((value) => variantMatchesQuery(service.slug, value, q))
        : [];
    if (named.length > 0) {
      for (const value of named) rows.push({ key: `${service.slug}:${value}`, service, variant: value });
    } else if (matched.has(service.slug)) {
      rows.push({ key: service.slug, service });
    }
  }
  return rows;
}
