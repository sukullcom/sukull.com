import db from "@/db/drizzle";
import { adminAudit } from "@/db/schema";
import { eq, desc, sql, gte, and, ilike } from "drizzle-orm";
import { Filter, ShieldCheck } from "lucide-react";

type SearchParams = {
  action?: string;
  actor?: string;
  targetType?: string;
  hours?: string;
};

// Auth + admin gate handled by app/(main)/admin/layout.tsx.
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const hours = Math.max(1, Math.min(24 * 365, Number(params.hours ?? 168)));
  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const whereClauses = [gte(adminAudit.createdAt, sinceDate)];
  if (params.action) whereClauses.push(eq(adminAudit.action, params.action));
  if (params.targetType) whereClauses.push(eq(adminAudit.targetType, params.targetType));
  if (params.actor) whereClauses.push(ilike(adminAudit.actorEmail, `%${params.actor}%`));

  const whereExpr = whereClauses.length === 1 ? whereClauses[0] : and(...whereClauses);

  const [rows, summaryRows, actorTop] = await Promise.all([
    db
      .select()
      .from(adminAudit)
      .where(whereExpr)
      .orderBy(desc(adminAudit.createdAt))
      .limit(200),
    db
      .select({
        action: adminAudit.action,
        count: sql<number>`count(*)::int`,
      })
      .from(adminAudit)
      .where(gte(adminAudit.createdAt, sinceDate))
      .groupBy(adminAudit.action)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(12),
    db
      .select({
        actorEmail: adminAudit.actorEmail,
        count: sql<number>`count(*)::int`,
      })
      .from(adminAudit)
      .where(gte(adminAudit.createdAt, sinceDate))
      .groupBy(adminAudit.actorEmail)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(6),
  ]);

  const totalInWindow = summaryRows.reduce((sum, r) => sum + r.count, 0);

  const distinctActions = Array.from(new Set(summaryRows.map((s) => s.action))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900">Yönetici Günlüğü</h1>
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
              <option value="24">24</option>
              <option value="168">7 gün</option>
              <option value="720">30 gün</option>
              <option value="2160">90 gün</option>
              <option value="8760">1 yıl</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Eylem
            </label>
            <select
              name="action"
              defaultValue={params.action ?? ""}
              className="rounded-md border px-2 py-1.5 text-sm min-w-[220px]"
            >
              <option value="">Hepsi</option>
              {distinctActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hedef türü
            </label>
            <input
              type="text"
              name="targetType"
              defaultValue={params.targetType ?? ""}
              placeholder="örn. teacher_application"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Yönetici e-postası
            </label>
            <input
              type="text"
              name="actor"
              defaultValue={params.actor ?? ""}
              placeholder="admin@..."
              className="rounded-md border px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700"
          >
            <Filter className="h-4 w-4" /> Filtrele
          </button>
          <div className="ml-auto text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {totalInWindow.toLocaleString("tr-TR")}
            </span>{" "}
            kayıt (son {hours >= 24 ? `${Math.round(hours / 24)} gün` : `${hours} saat`})
          </div>
        </form>

        {summaryRows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {summaryRows.map((s) => (
              <div key={s.action} className="rounded-lg border bg-white p-3">
                <p className="text-xs text-gray-500 truncate" title={s.action}>
                  {s.action}
                </p>
                <p className="text-lg font-bold text-gray-900">{s.count}</p>
              </div>
            ))}
          </div>
        )}

        {actorTop.length > 0 && (
          <div className="rounded-xl border bg-white p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              En aktif yöneticiler
            </h2>
            <div className="flex flex-wrap gap-2">
              {actorTop.map((a) => (
                <span
                  key={a.actorEmail ?? "bilinmiyor"}
                  className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700"
                >
                  <span className="font-medium">
                    {a.actorEmail ?? "(bilinmiyor)"}
                  </span>
                  <span className="text-gray-500">· {a.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-800">
              Son eylemler (en fazla 200)
            </h2>
          </div>
          <div className="divide-y">
            {rows.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-8 text-center">
                Bu aralıkta kayıtlı yönetici eylemi yok.
              </p>
            ) : (
              rows.map((row) => (
                <details key={row.id} className="group">
                  <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 list-none">
                    <ActionPill action={row.action} />
                    <span className="text-sm text-gray-800 shrink-0 max-w-[180px] truncate">
                      {row.actorEmail ?? row.actorId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-500 flex-1 truncate">
                      {row.targetType
                        ? `${row.targetType}${row.targetId ? `:${row.targetId}` : ""}`
                        : ""}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("tr-TR")
                        : "-"}
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pt-1 bg-gray-50 text-xs font-mono text-gray-700 space-y-2">
                    <div>
                      <span className="text-gray-500">actor:</span> {row.actorId}
                      {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                    </div>
                    {row.ip && (
                      <div>
                        <span className="text-gray-500">ip:</span> {row.ip}
                      </div>
                    )}
                    {row.userAgent && (
                      <div className="break-all">
                        <span className="text-gray-500">user-agent:</span> {row.userAgent}
                      </div>
                    )}
                    {row.metadata && Object.keys(row.metadata).length > 0 && (
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

function ActionPill({ action }: { action: string }) {
  const [group] = action.split(".");
  const styles: Record<string, string> = {
    teacher_application: "bg-blue-100 text-blue-800",
    student_application: "bg-indigo-100 text-indigo-800",
    user: "bg-purple-100 text-purple-800",
    course: "bg-emerald-100 text-emerald-800",
    unit: "bg-emerald-50 text-emerald-700",
    lesson: "bg-teal-100 text-teal-800",
    challenge: "bg-amber-100 text-amber-800",
    admin: "bg-gray-200 text-gray-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${
        styles[group] ?? "bg-gray-100 text-gray-800"
      }`}
      title={action}
    >
      {action}
    </span>
  );
}
