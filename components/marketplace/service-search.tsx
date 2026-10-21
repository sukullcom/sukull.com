"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { CategoryTiles } from "@/components/marketplace/category-tiles";
import { searchSuggestions, suggestionHref, type ServiceSuggestion } from "@/lib/marketplace/search";

const STEPS = [
  { title: "İhtiyacını anlat", text: "Birkaç soruyu cevapla, yeri ve zamanı seç." },
  { title: "Teklif al", text: "Hizmet verenler fiyat ve mesaj gönderir. En fazla dört teklif gelir." },
  { title: "Karşılaştır ve seç", text: "Sana uyan teklifi kabul et, sonra yazış." },
];

export function ServiceSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => searchSuggestions(query, 10), [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function choose(item: ServiceSuggestion) {
    setOpen(false);
    router.push(suggestionHref(item));
  }

  function chooseCategory(slug: string) {
    router.push(`/talep/yeni?kategori=${encodeURIComponent(slug)}`);
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-4">
      <div className="rounded-3xl bg-suk-brand-soft px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-sm font-bold uppercase tracking-wide text-suk-brand">Sukull</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          İhtiyacın olan hizmete ulaş
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          Hizmeti seç, birkaç soruyu cevapla, teklifler gelsin. Sukull ücret almaz.
        </p>
      </div>

      <div ref={searchRef} className="relative -mt-2">
        <label className="sr-only" htmlFor="hizmet-ara">
          Hizmet ara
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="hizmet-ara"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Örneğin ders, temizlik, tesisat"
          className="w-full rounded-2xl border-2 border-b-4 border-border bg-card py-4 pl-12 pr-4 text-base outline-none transition-colors focus:border-suk-brand"
          autoComplete="off"
        />
        {open && (
          <ul className="absolute z-40 mt-2 max-h-96 w-full overflow-auto rounded-2xl border-2 border-b-4 border-border bg-card p-2 shadow-lg">
            {suggestions.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted-foreground">Bu aramaya uygun hizmet yok.</li>
            )}
            {suggestions.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-xl px-3 py-3 text-left hover:bg-muted"
                  onClick={() => choose(item)}
                >
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold">Kategoriler</h2>
        <CategoryTiles onSelect={chooseCategory} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Nasıl çalışır?</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="mk-card p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-suk-brand text-sm font-bold text-suk-brand-fg">
                {index + 1}
              </span>
              <p className="mt-3 font-bold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="Yasal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 pb-2 text-xs text-muted-foreground">
        <Link href="/yasal/kullanim-sartlari" className="hover:text-foreground hover:underline">
          Kullanım şartları
        </Link>
        <Link href="/yasal/kvkk" className="hover:text-foreground hover:underline">
          KVKK
        </Link>
        <Link href="/yasal/gizlilik" className="hover:text-foreground hover:underline">
          Gizlilik
        </Link>
      </nav>
    </div>
  );
}
