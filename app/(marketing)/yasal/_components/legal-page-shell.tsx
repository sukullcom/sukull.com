import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LEGAL_UPDATED, type LegalDocumentId } from "@/lib/legal-info";

interface LegalPageShellProps {
  /** Matches a key in `LEGAL_UPDATED`; used for the "Yürürlük Tarihi" line. */
  documentId: LegalDocumentId;
  /** Sayfanın h1 başlığı. */
  title: string;
  /** Kısa bir üst metin — genelde "bu belge" diye başlayan bağlam cümlesi. */
  lede?: string;
  children: React.ReactNode;
}

/**
 * Shared shell for every `/yasal/*` page.
 *
 * - Renders a consistent `max-w-3xl` reading column with prose typography.
 * - Always shows the last-updated date from `LEGAL_UPDATED` so auditors
 *   and users can verify the document version quickly.
 * - Always shows a back link to the TOC so visitors coming in via Google
 *   can navigate to sibling documents (KVKK ↔ Çerez ↔ Kullanım Şartları).
 *
 * Legal content lives inside `children` as plain HTML / MDX-like JSX —
 * we deliberately do *not* render Markdown at runtime because every
 * paragraph of a Turkish legal document may need per-case tweaks and
 * Markdown would add an opaque layer between the lawyer's pen and the
 * DOM.
 */
export function LegalPageShell({
  documentId,
  title,
  lede,
  children,
}: LegalPageShellProps) {
  const updatedAt = LEGAL_UPDATED[documentId];

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Link
        prefetch={false}
        href="/yasal"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Yasal belgeler
      </Link>

      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-3 text-base text-muted-foreground">{lede}</p>
        ) : null}
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground/80">
          Yürürlük tarihi:{" "}
          <time dateTime={updatedAt}>
            {new Date(updatedAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
      </header>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed prose-li:my-1 prose-a:text-suk-brand">
        {children}
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        Bu belge bilgilendirme amaçlıdır. Hukuki uyuşmazlık hâlinde tebligat
        ve yetkili merciler hakkında detaylar için{" "}
        <Link prefetch={false} href="/yasal/kullanim-sartlari" className="underline hover:text-foreground">
          Kullanım Şartları
        </Link>{" "}
        belgesine bakınız.
      </footer>
    </article>
  );
}
