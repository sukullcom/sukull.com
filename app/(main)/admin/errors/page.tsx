import db from "@/db/drizzle";
import { errorLog } from "@/db/schema";
import { eq, desc, sql, gte } from "drizzle-orm";
import { AlertTriangle, Filter } from "lucide-react";

type SearchParams = {
  source?: string;
  level?: string;
  hours?: string;
};

export const dynamic = "force-dynamic";

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth + admin gate handled by app/(main)/admin/layout.tsx.
  const params = await searchParams;
  const hours = Math.max(1, Math.min(720, Number(params.hours ?? 24)));
  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const whereClauses = [gte(errorLog.createdAt, sinceDate)];
  if (params.source) whereClauses.push(eq(errorLog.source, params.source));
  if (params.level) whereClauses.push(eq(errorLog.level, params.level));

  const [rows, summaryRows] = await Promise.all([
    db
      .select()
      .from(errorLog)
      .where(sql`${sql.join(whereClauses, sql` AND `)}`)
      .orderBy(desc(errorLog.createdAt))
      .limit(200),
    db
      .select({
        source: errorLog.source,
        level: errorLog.level,
        count: sql<number>`count(*)::int`,
      })
      .from(errorLog)
      .where(gte(errorLog.createdAt, sinceDate))
      .groupBy(errorLog.source, errorLog.level)
      .orderBy(desc(sql<number>`count(*)`)),
  ]);

  const totalInWindow = summaryRows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h1 className="text-2xl font-bold text-gray-900">Hata Kayıtları</h1>
      </div>

        <form className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white border rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Son (saat)
            </label>
            <select
              name="hours"
              defaultValue={String(hours)}
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="1">1</option>
              <option value="6">6</option>
              <option value="24">24</option>
              <option value="72">72</option>
              <option value="168">168</option>
              <option value="720">720</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak</label>
            <select
              name="source"
              defaultValue={params.source ?? ""}
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">Hepsi</option>
              <option value="server-action">server-action</option>
              <option value="api-route">api-route</option>
              <option value="client">client</option>
              <option value="middleware">middleware</option>
              <option value="cron">cron</option>
              <option value="payment">payment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Seviye</label>
            <select
              name="level"
              defaultValue={params.level ?? ""}
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">Hepsi</option>
              <option value="error">error</option>
              <option value="warn">warn</option>
              <option value="fatal">fatal</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700"
          >
            <Filter className="h-4 w-4" /> Filtrele
          </button>
          <div className="ml-auto text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{totalInWindow.toLocaleString("tr-TR")}</span>{" "}
            olay (son {hours} saat)
          </div>
        </form>

        {summaryRows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {summaryRows.slice(0, 12).map((s) => (
              <div
                key={`${s.source}:${s.level}`}
                className="rounded-lg border bg-white p-3"
              >
                <p className="text-xs text-gray-500 truncate">{s.source}</p>
                <p className="text-xs text-gray-400 mb-1">{s.level}</p>
                <p className="text-lg font-bold text-gray-900">{s.count}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-800">
              Son olaylar (en fazla 200)
            </h2>
          </div>
          <div className="divide-y">
            {rows.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-8 text-center">
                Bu aralıkta kayıtlı hata yok. Her şey yolunda.
              </p>
            ) : (
              rows.map((row) => (
                <details key={row.id} className="group">
                  <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 list-none">
                    <LevelPill level={row.level} />
                    <span className="text-xs font-mono text-gray-500 shrink-0">
                      {row.source}
                    </span>
                    <span className="text-sm text-gray-800 flex-1 truncate">
                      {row.message}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("tr-TR")
                        : "-"}
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pt-1 bg-gray-50 text-xs font-mono text-gray-700 space-y-2">
                    {row.location && (
                      <div>
                        <span className="text-gray-500">location:</span> {row.location}
                      </div>
                    )}
                    {row.url && (
                      <div className="break-all">
                        <span className="text-gray-500">url:</span> {row.url}
                      </div>
                    )}
                    {row.userId && (
                      <div>
                        <span className="text-gray-500">user:</span> {row.userId}
                      </div>
                    )}
                    {row.stack && (
                      <pre className="whitespace-pre-wrap break-all bg-white border rounded p-2 text-[11px]">
                        {row.stack}
                      </pre>
                    )}
                    {row.metadata && (
                      <pre className="whitespace-pre-wrap break-all bg-white border rounded p-2 text-[11px]">
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
    </div>
  );
}

function LevelPill({ level }: { level: string }) {
  const styles: Record<string, string> = {
    error: "bg-red-100 text-red-800",
    warn: "bg-yellow-100 text-yellow-800",
    fatal: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
        styles[level] || styles.error
      }`}
    >
      {level}
    </span>
  );
}
