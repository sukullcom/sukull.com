"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { normalizeForSearch } from "@/lib/turkish-locale";
import { cn } from "@/lib/utils";

/**
 * Kütüphane bağımlılığı olmayan, klavye ile dolaşılabilir, Türkçe-uyumlu
 * arama yapan bir combobox. Eğitmen rehberi (üniversite, şehir, vb.) +
 * "Ders ver" formu (üniversite seçimi) tarafından kullanılır.
 *
 * Davranış:
 *  - `value` `null` ise placeholder gösterir; seçim yapıldığında label.
 *  - Açılır kapanır, dışarı tıklama / Esc ile kapanır.
 *  - Arama Türkçe locale-aware (büyük/küçük + diakritik fark etmez).
 *  - `allowFreeText=true` ise listede olmasa da kullanıcı kendi metnini
 *    onaylayabilir — şehir gibi serbest alanlar için.
 */
export interface ComboboxOption {
  value: string;
  /** Görsel etiket. Verilmezse `value` kullanılır. */
  label?: string;
  /** Listede yardımcı bilgi (örn. il). */
  hint?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  allowFreeText?: boolean;
  clearable?: boolean;
  className?: string;
  buttonClassName?: string;
  leftIcon?: ReactNode;
  /** Açıklayıcı id; <Label htmlFor="..."> ile bağlamak için. */
  id?: string;
  ariaLabel?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Seç...",
  emptyText = "Sonuç yok",
  loadingText = "Yükleniyor...",
  isLoading = false,
  disabled = false,
  allowFreeText = false,
  clearable = true,
  className,
  buttonClassName,
  leftIcon,
  id,
  ariaLabel,
}: SearchableComboboxProps) {
  const autoId = useId();
  const listboxId = id ?? autoId;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? hit?.value ?? value;
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return options;
    return options.filter((o) => {
      const hay = normalizeForSearch(`${o.label ?? o.value} ${o.hint ?? ""}`);
      return hay.includes(q);
    });
  }, [options, query]);

  // Dışarı tıkla & Esc ile kapat.
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Açıldığında input'a fokuslan + ilk eşleşmeyi vurgula.
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    } else {
      setQuery("");
    }
  }, [open]);

  const commit = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        commit(filtered[activeIndex].value);
      } else if (allowFreeText && query.trim()) {
        commit(query.trim());
      }
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left",
          "focus:outline-none focus:border-suk-brand focus:ring-1 focus:ring-suk-brand/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "bg-background",
          buttonClassName,
        )}
      >
        {leftIcon ? (
          <span className="text-muted-foreground shrink-0">{leftIcon}</span>
        ) : null}
        <span
          className={cn(
            "flex-1 truncate",
            selectedLabel ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        {clearable && value ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              commit(null);
            }}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Seçimi temizle"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg",
          )}
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ara..."
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                className="w-full rounded-md border bg-background pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:border-suk-brand focus:ring-1 focus:ring-suk-brand/20"
              />
            </div>
          </div>

          <ul
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto py-1 text-sm"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-muted-foreground">{loadingText}</li>
            ) : filtered.length === 0 ? (
              <>
                <li className="px-3 py-2 text-muted-foreground">{emptyText}</li>
                {allowFreeText && query.trim() && (
                  <li
                    role="option"
                    aria-selected={false}
                    className="cursor-pointer border-t px-3 py-2 hover:bg-suk-brand-soft"
                    // onMouseDown + preventDefault, search input'tan odak
                    // koparken oluşan blur'un click event'ini yutmasını
                    // engeller. Headless-UI / Radix de aynı kalıbı kullanır.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(query.trim());
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      commit(query.trim());
                    }}
                  >
                    <span className="text-foreground">
                      &ldquo;{query.trim()}&rdquo; olarak ekle
                    </span>
                  </li>
                )}
              </>
            ) : (
              filtered.map((o, i) => {
                const isActive = i === activeIndex;
                const isSelected = o.value === value;
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 select-none",
                      isActive && "bg-suk-brand-soft",
                      isSelected && "font-medium text-suk-brand-border",
                    )}
                    onMouseEnter={() => setActiveIndex(i)}
                    // onMouseDown ile commit ediyoruz; click event'i bazı
                    // tarayıcılarda odak değişimi sırasında düşebiliyor
                    // ("liste kapanıyor ama seçilmiyor" şikayetinin
                    // klasik sebebi). onTouchEnd ile mobil tıklama da
                    // garantiye alındı.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(o.value);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      commit(o.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isSelected
                          ? "text-suk-brand"
                          : "text-transparent",
                      )}
                    />
                    <span className="flex-1 truncate">
                      {o.label ?? o.value}
                    </span>
                    {o.hint ? (
                      <span className="text-xs text-muted-foreground">
                        {o.hint}
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
