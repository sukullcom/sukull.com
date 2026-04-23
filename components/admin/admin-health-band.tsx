import { sql } from "drizzle-orm";
import Link from "next/link";
import db from "@/db/drizzle";
import { errorLog, adminAudit } from "@/db/schema";
import { count, gte } from "drizzle-orm";
import { Activity, AlertTriangle, ShieldCheck, Heart } from "lucide-react";

export function AdminHealthBandSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-gray-50 border-gray-200 p-4 animate-pulse"
        >
          <div className="h-5 w-5 mb-2 bg-gray-200 rounded" />
          <div className="h-6 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

type HealthStat = {
  label: string;
  value: string;
  icon: typeof Activity;
  href?: string;
  tone: "ok" | "warn" | "danger";
  hint?: string;
};

export async function AdminHealthBand() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since1h = new Date(Date.now() - 60 * 60 * 1000);

  const [errors24hRow, errors1hRow, actions24hRow, lastErrorRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(errorLog)
      .where(gte(errorLog.createdAt, since24h))
      .then((r) => r[0] ?? { value: 0 })
      .catch(() => ({ value: 0 })),
    db
      .select({ value: count() })
      .from(errorLog)
      .where(gte(errorLog.createdAt, since1h))
      .then((r) => r[0] ?? { value: 0 })
      .catch(() => ({ value: 0 })),
    db
      .select({ value: count() })
      .from(adminAudit)
      .where(gte(adminAudit.createdAt, since24h))
      .then((r) => r[0] ?? { value: 0 })
      .catch(() => ({ value: 0 })),
    db
      .select({ createdAt: errorLog.createdAt })
      .from(errorLog)
      .orderBy(sql`${errorLog.createdAt} desc`)
      .limit(1)
      .then((r) => r[0])
      .catch(() => undefined),
  ]);

  const errors24h = Number(errors24hRow.value ?? 0);
  const errors1h = Number(errors1hRow.value ?? 0);
  const actions24h = Number(actions24hRow.value ?? 0);

  const systemStatus: HealthStat["tone"] =
    errors1h > 10 ? "danger" : errors24h > 50 ? "warn" : "ok";

  const stats: HealthStat[] = [
    {
      label: "Sistem Durumu",
      value:
        systemStatus === "ok"
          ? "Sağlıklı"
          : systemStatus === "warn"
            ? "Dikkat"
            : "Kritik",
      icon: Heart,
      tone: systemStatus,
      hint: lastErrorRow
        ? `Son hata: ${formatRelative(new Date(lastErrorRow.createdAt))}`
        : "Kayıtlı hata yok",
    },
    {
      label: "Son 1 saat hata",
      value: errors1h.toLocaleString("tr-TR"),
      icon: AlertTriangle,
      href: "/admin/errors",
      tone: errors1h > 10 ? "danger" : errors1h > 0 ? "warn" : "ok",
    },
    {
      label: "Son 24 saat hata",
      value: errors24h.toLocaleString("tr-TR"),
      icon: AlertTriangle,
      href: "/admin/errors",
      tone: errors24h > 50 ? "danger" : errors24h > 10 ? "warn" : "ok",
    },
    {
      label: "Son 24 saat admin aksiyonu",
      value: actions24h.toLocaleString("tr-TR"),
      icon: ShieldCheck,
      href: "/admin/audit",
      tone: "ok",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const content = (
          <div
            className={`rounded-xl border p-4 transition-colors ${toneClasses(stat.tone)} ${
              stat.href ? "hover:shadow-md" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 opacity-70" />
              {stat.tone !== "ok" && (
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    stat.tone === "danger" ? "bg-red-500 animate-pulse" : "bg-yellow-500"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
            <p className="mt-2 text-2xl font-bold leading-none">{stat.value}</p>
            <p className="mt-1 text-xs font-medium opacity-80">{stat.label}</p>
            {stat.hint && <p className="mt-2 text-[11px] opacity-70">{stat.hint}</p>}
          </div>
        );

        if (stat.href) {
          return (
            <Link key={stat.label} href={stat.href} className="block">
              {content}
            </Link>
          );
        }
        return <div key={stat.label}>{content}</div>;
      })}
    </div>
  );
}

function toneClasses(tone: HealthStat["tone"]): string {
  switch (tone) {
    case "danger":
      return "bg-red-50 text-red-800 border-red-200";
    case "warn":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    default:
      return "bg-green-50 text-green-800 border-green-200";
  }
}

function formatRelative(date: Date): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} sn önce`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} gün önce`;
}
