"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusDot } from "@/components/marketplace/status-dot";
import { Button } from "@/components/ui/button";
import type { RequestTone } from "@/lib/marketplace/format";
import { MarketAvatar } from "@/components/marketplace/market-avatar";

export type JobListItem = {
  id: number;
  code: string;
  name: string;
  whenLabel: string;
  active: boolean;
  tone: RequestTone;
  statusLabel: string;
  rejectionNote: string | null;
  showQuotes: boolean;
  quotes: { id: number; avatar: string }[];
};

export function JobsBoard({ jobs }: { jobs: JobListItem[] }) {
  const [tab, setTab] = useState<"active" | "old">("active");
  const visible = jobs.filter((job) => (tab === "active" ? job.active : !job.active));

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-4 text-2xl font-extrabold">İlanlarım</h1>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border-2 border-border bg-muted p-1">
        <button
          type="button"
          className={`rounded-xl py-2 text-sm font-bold ${tab === "active" ? "border-2 border-b-4 border-border bg-card text-suk-brand" : "border-2 border-transparent text-muted-foreground"}`}
          onClick={() => setTab("active")}
        >
          Aktif ilanlarım
        </button>
        <button
          type="button"
          className={`rounded-xl py-2 text-sm font-bold ${tab === "old" ? "border-2 border-b-4 border-border bg-card text-suk-brand" : "border-2 border-transparent text-muted-foreground"}`}
          onClick={() => setTab("old")}
        >
          Eski ilanlarım
        </button>
      </div>
      {visible.length === 0 ? (
        <div className="mk-empty">
          {tab === "active" ? (
            <>
              <p className="font-semibold text-foreground">Aktif ilanın yok.</p>
              <p className="mt-2">
                Hemen arama çubuğuna istediğini yaz, ihtiyacın olan hizmete kolayca ulaş.
              </p>
              <Button asChild variant="primary" className="mt-4">
                <Link href="/">Hizmet ara</Link>
              </Button>
            </>
          ) : (
            <p>Eski ilanın yok.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((job) => (
            <li key={job.id}>
                <Link href={`/islerim/${job.id}`} className="mk-card-press min-h-[88px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">{job.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{job.whenLabel}</p>
                    <div className="mt-2">
                      <StatusDot tone={job.tone} label={job.statusLabel} />
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {job.code}
                  </span>
                </div>
                {job.rejectionNote && (
                  <p className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <span className="font-bold">Reddedilme nedeni: </span>
                    {job.rejectionNote}
                  </p>
                )}
                <div className={`mt-3 items-center gap-2 ${job.showQuotes ? "flex" : "hidden"}`}>
                  {job.quotes.length === 0 ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      Teklif gelmedi
                    </span>
                  ) : (
                    <div className="flex items-center">
                      {job.quotes.map((quote, index) => (
                        <MarketAvatar
                          key={quote.id}
                          src={quote.avatar}
                          size={36}
                          className={`ring-2 ring-card ${index > 0 ? "-ml-2" : ""}`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-semibold text-muted-foreground">
                        {job.quotes.length} teklif
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
