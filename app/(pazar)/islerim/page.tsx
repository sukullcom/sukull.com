import type { Metadata } from "next";

import { JobsBoard } from "@/components/marketplace/jobs-board";
import { listCustomerJobs } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import { formatWhen, requestCode, requestState } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İlanlarım" };

export default async function JobsPage() {
  const account = await requireMarketAccount("/islerim");
  const jobs = await listCustomerJobs(account.id);
  const now = Date.now();
  return (
    <JobsBoard
      jobs={jobs.map((job) => {
        const state = requestState({ status: job.status, quoteCount: job.quoteCount, expiresAt: job.expiresAt, now });
        return {
          id: job.id,
          code: requestCode(job.id),
          name: getService(job.serviceSlug)?.name ?? job.serviceSlug,
          whenLabel: formatWhen(job.timingType, job.scheduledAt),
          active: !state.expired,
          tone: state.tone,
          statusLabel: state.label,
          showQuotes: job.status !== "pending" && job.status !== "rejected",
          rejectionNote: job.status === "rejected" ? job.rejectionNote : null,
          quotes: job.quotes.map((quote) => ({ id: quote.id, avatar: quote.avatar ?? "" })),
        };
      })}
    />
  );
}
