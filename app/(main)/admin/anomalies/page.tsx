import Link from "next/link";
import {
  ShieldAlert,
  TrendingUp,
  AlertCircle,
  Coins,
  ScrollText,
} from "lucide-react";
import { sql } from "drizzle-orm";

import db from "@/db/drizzle";

/**
 * Admin → Anomali izleme.
 *
 * Bu sayfa **salt okuma**dır: olası kötüye kullanım sinyalini ortaya koyar,
 * otomatik aksiyon almaz. Yetkili bir admin görüp manuel inceler.
 *
 * Sinyaller:
 *   1. **Hızlı puan artışı (24 saat):** `points - previous_total_points`
 *      dağılımın çok üstüne çıkanlar — oyun farming, çoklu sekme spam,
 *      ya da bilinmeyen bir bypass'ın erken işareti.
 *   2. **Çoklu ders bonusu (24 saat):** aynı kullanıcının çok sayıda
 *      ders bitirme bonusu alması — `lesson_completion_bonuses` idempotent
 *      olduğu için artık çok kullanıcının `lessonId` setini "tarayıp
 *      bitirmediği" dersleri kapatmasını gösterir.
 *   3. **Kredi bütünlüğü:** `available_credits + used_credits != total_credits`
 *      veya negatif kolon — settle path'inde drift varsa burada görünür.
 *   4. **İlerleme bütünlüğü:** `hearts > 5` ya da `hearts < 0`,
 *      `points < 0`, `istikrar < 0` — kod yolu kırıkları.
 *
 * Hepsi indeksli sütunlar üzerinden çalışır, üretimde ucuzdur (24 saat
 * filtresiyle 50–100 satır). Cron'a çıkarmaya gerek yok — admin bu sayfayı
 * ne zaman açarsa o an taze.
 *
 * Auth + admin gate: `app/(main)/admin/layout.tsx`.
 */
export const dynamic = "force-dynamic";

type Hours = 1 | 6 | 24 | 72 | 168;

const HOUR_OPTIONS: Hours[] = [1, 6, 24, 72, 168];

type SearchParams = { hours?: string };

type PointsAnomalyRow = {
  userId: string;
  name: string | null;
  email: string | null;
  points: number;
  delta: number;
  istikrar: number;
};

type LessonBonusRow = {
  userId: string;
  name: string | null;
  email: string | null;
  bonusCount: number;
  pointsAwarded: number;
  lastAwardedAt: Date | null;
};

type CreditIntegrityRow = {
  userId: string;
  name: string | null;
  email: string | null;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  drift: number;
};

type ProgressIntegrityRow = {
  userId: string;
  name: string | null;
  email: string | null;
  hearts: number;
  points: number;
  istikrar: number;
  reason: string;
};

type LogNoiseRow = {
  source: string;
  location: string | null;
  count: number;
  uniqueUsers: number;
  suppressed: number;
  lastSeenAt: Date | null;
  sampleMessage: string;
};

type LogTotalsRow = {
  total: number;
  uniqueUsers: number;
};

export default async function AdminAnomaliesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requested = Number(params.hours ?? 24);
  const hours: Hours = (HOUR_OPTIONS.find((h) => h === requested) ?? 24) as Hours;
  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [
    pointsAnomaliesRes,
    lessonBonusesRes,
    creditIntegrityRes,
    progressIntegrityRes,
    logNoiseRes,
    logTotalsRes,
  ] = await Promise.all([
      db.execute<PointsAnomalyRow>(sql`
        SELECT
          up.user_id        AS "userId",
          u.name            AS name,
          u.email           AS email,
          up.points         AS points,
          (up.points - COALESCE(up.previous_total_points, 0))::int AS delta,
          up.istikrar       AS istikrar
        FROM user_progress up
        LEFT JOIN users u ON u.id = up.user_id
        WHERE COALESCE(up.last_streak_check, NOW()) >= ${sinceDate}
          AND (up.points - COALESCE(up.previous_total_points, 0)) >= 500
        ORDER BY (up.points - COALESCE(up.previous_total_points, 0)) DESC
        LIMIT 25
      `),
      db.execute<LessonBonusRow>(sql`
        SELECT
          lcb.user_id              AS "userId",
          u.name                   AS name,
          u.email                  AS email,
          COUNT(*)::int            AS "bonusCount",
          SUM(lcb.total_awarded)::int AS "pointsAwarded",
          MAX(lcb.awarded_at)      AS "lastAwardedAt"
        FROM lesson_completion_bonuses lcb
        LEFT JOIN users u ON u.id = lcb.user_id
        WHERE lcb.awarded_at >= ${sinceDate}
        GROUP BY lcb.user_id, u.name, u.email
        HAVING COUNT(*) >= 25
        ORDER BY COUNT(*) DESC
        LIMIT 25
      `),
      db.execute<CreditIntegrityRow>(sql`
        SELECT
          uc.user_id                                   AS "userId",
          u.name                                       AS name,
          u.email                                      AS email,
          uc.total_credits                             AS "totalCredits",
          uc.used_credits                              AS "usedCredits",
          uc.available_credits                         AS "availableCredits",
          (uc.total_credits - uc.used_credits - uc.available_credits)::int AS drift
        FROM user_credits uc
        LEFT JOIN users u ON u.id = uc.user_id
        WHERE uc.available_credits < 0
           OR uc.used_credits < 0
           OR uc.total_credits < 0
           OR uc.used_credits > uc.total_credits
           OR (uc.total_credits - uc.used_credits - uc.available_credits) <> 0
        ORDER BY ABS(uc.total_credits - uc.used_credits - uc.available_credits) DESC
        LIMIT 50
      `),
      db.execute<ProgressIntegrityRow>(sql`
        SELECT
          up.user_id   AS "userId",
          u.name       AS name,
          u.email      AS email,
          up.hearts    AS hearts,
          up.points    AS points,
          up.istikrar  AS istikrar,
          CASE
            WHEN up.hearts > 5  THEN 'hearts > 5'
            WHEN up.hearts < 0  THEN 'hearts < 0'
            WHEN up.points < 0  THEN 'points < 0'
            WHEN up.istikrar < 0 THEN 'istikrar < 0'
            ELSE 'unknown'
          END AS reason
        FROM user_progress up
        LEFT JOIN users u ON u.id = up.user_id
        WHERE up.hearts > 5
           OR up.hearts < 0
           OR up.points < 0
           OR up.istikrar < 0
        ORDER BY up.points DESC
        LIMIT 50
      `),
      // Log gürültüsü: kim/neresi error_log'u şişiriyor?
      // `created_at` üzerinden indekslidir (error_log_created_at_idx);
      // 24h pencere tarama ucuzdur. metadata.suppressedCount in-process
      // coalesce sayacı — DB'ye düşmeyen "atlatılan" satırların ağırlığını
      // burada da görelim.
      db.execute<LogNoiseRow>(sql`
        SELECT
          el.source                                          AS source,
          el.location                                        AS location,
          COUNT(*)::int                                      AS count,
          COUNT(DISTINCT el.user_id)::int                    AS "uniqueUsers",
          COALESCE(
            SUM((el.metadata->>'suppressedCount')::int),
            0
          )::int                                             AS suppressed,
          MAX(el.created_at)                                 AS "lastSeenAt",
          (ARRAY_AGG(el.message ORDER BY el.created_at DESC))[1]
                                                             AS "sampleMessage"
        FROM error_log el
        WHERE el.created_at >= ${sinceDate}
        GROUP BY el.source, el.location
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `),
      db.execute<LogTotalsRow>(sql`
        SELECT
          COUNT(*)::int                       AS total,
          COUNT(DISTINCT user_id)::int        AS "uniqueUsers"
        FROM error_log
        WHERE created_at >= ${sinceDate}
      `),
    ]);

  const pointsAnomalies = extractRows<PointsAnomalyRow>(pointsAnomaliesRes);
  const lessonBonusRows = extractRows<LessonBonusRow>(lessonBonusesRes);
  const creditIntegrityRows = extractRows<CreditIntegrityRow>(creditIntegrityRes);
  const progressIntegrityRows = extractRows<ProgressIntegrityRow>(progressIntegrityRes);
  const logNoiseRows = extractRows<LogNoiseRow>(logNoiseRes);
  const logTotalsRows = extractRows<LogTotalsRow>(logTotalsRes);
  const logTotal = logTotalsRows[0]?.total ?? 0;
  const logUniqueUsers = logTotalsRows[0]?.uniqueUsers ?? 0;

  const totalSignals =
    pointsAnomalies.length + lessonBonusRows.length + creditIntegrityRows.length + progressIntegrityRows.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-amber-600" />
        <h1 className="text-2xl font-bold text-foreground">Anomali İzleme</h1>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Son (saat)
          </label>
          <select
            name="hours"
            defaultValue={String(hours)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background hover:opacity-90"
        >
          Filtrele
        </button>
        <div className="ml-auto text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalSignals}</span> sinyal
          (son {hours} saat)
        </div>
      </form>

      <AnomalySection
        icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
        title="Hızlı puan artışı (≥ 500 / son baseline)"
        description="Bu pencerede `points − previous_total_points` ≥ 500 olan kullanıcılar. Erken kuş çarpanıyla normal bir oyun seansı bile yüksek olabilir; mavi tablo bir kapı değil, dikkat ediyor olmak için ipucu."
        emptyText="Bu pencerede anormal puan artışı yok."
      >
        {pointsAnomalies.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kullanıcı</Th>
                <Th right>Artış (24h)</Th>
                <Th right>Toplam Puan</Th>
                <Th right>İstikrar</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pointsAnomalies.map((row) => (
                <tr key={row.userId} className="hover:bg-muted/40">
                  <td className="px-4 py-2">
                    <UserCell name={row.name} email={row.email} userId={row.userId} />
                  </td>
                  <Td right strong>
                    +{Number(row.delta).toLocaleString("tr-TR")}
                  </Td>
                  <Td right>{Number(row.points).toLocaleString("tr-TR")}</Td>
                  <Td right>{row.istikrar}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnomalySection>

      <AnomalySection
        icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
        title="Çoklu ders tamamlama bonusu (≥ 25 / pencere)"
        description="`lesson_completion_bonuses` artık idempotent. Bir kullanıcının kısa sürede çok sayıda farklı dersi 'bitirmesi' ya gerçek bir maraton ya da otomasyon işaretidir. Otomasyonsa zaten puanları kovayla kısıtlı."
        emptyText="Bu pencerede çoklu ders bonusu yok."
      >
        {lessonBonusRows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kullanıcı</Th>
                <Th right>Bonus Sayısı</Th>
                <Th right>Toplam Puan</Th>
                <Th right>Son</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lessonBonusRows.map((row) => (
                <tr key={row.userId} className="hover:bg-muted/40">
                  <td className="px-4 py-2">
                    <UserCell name={row.name} email={row.email} userId={row.userId} />
                  </td>
                  <Td right strong>{row.bonusCount}</Td>
                  <Td right>+{Number(row.pointsAwarded ?? 0).toLocaleString("tr-TR")}</Td>
                  <Td right>
                    {row.lastAwardedAt
                      ? new Date(row.lastAwardedAt).toLocaleString("tr-TR")
                      : "-"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnomalySection>

      <AnomalySection
        icon={<Coins className="h-5 w-5 text-red-600" />}
        title="Kredi bütünlüğü ihlali"
        description="`total = used + available` ya da kolon negatifse settle yolunda drift demektir. Üretimde sıfır olmalı; varsa ödeme akışına bakılması gerekiyor."
        emptyText="Kredi tablosu tutarlı (drift yok)."
      >
        {creditIntegrityRows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kullanıcı</Th>
                <Th right>Total</Th>
                <Th right>Used</Th>
                <Th right>Available</Th>
                <Th right>Drift</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creditIntegrityRows.map((row) => (
                <tr key={row.userId} className="hover:bg-muted/40">
                  <td className="px-4 py-2">
                    <UserCell name={row.name} email={row.email} userId={row.userId} />
                  </td>
                  <Td right>{row.totalCredits}</Td>
                  <Td right>{row.usedCredits}</Td>
                  <Td right>{row.availableCredits}</Td>
                  <Td right strong>
                    {row.drift > 0 ? `+${row.drift}` : row.drift}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnomalySection>

      <AnomalySection
        icon={<ScrollText className="h-5 w-5 text-sky-600" />}
        title="Log gürültüsü (error_log)"
        description={`Son ${hours} saatte ${logTotal.toLocaleString("tr-TR")} satır error_log üretildi (${logUniqueUsers.toLocaleString("tr-TR")} farklı kullanıcı). Aşağıda en çok satır üreten (kaynak, konum) çiftleri var — bir satırda "atlatılan" değeri yüksekse o yol coalesce ile %99 sessizleştirilmiş demektir; gerçekte aynı hata orantılı şekilde daha fazla tetikleniyor.`}
        emptyText="Bu pencerede error_log boş."
      >
        {logNoiseRows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kaynak / Konum</Th>
                <Th>Örnek mesaj</Th>
                <Th right>Satır</Th>
                <Th right>Atlatılan</Th>
                <Th right>Kullanıcı</Th>
                <Th right>Son</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logNoiseRows.map((row, i) => (
                <tr key={`${row.source}|${row.location ?? ""}|${i}`} className="hover:bg-muted/40">
                  <td className="px-4 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <code className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-800 w-fit">
                        {row.source}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {row.location ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs text-foreground line-clamp-2">
                      {row.sampleMessage || "—"}
                    </span>
                  </td>
                  <Td right strong>
                    {Number(row.count).toLocaleString("tr-TR")}
                  </Td>
                  <Td right>
                    {row.suppressed > 0
                      ? `+${Number(row.suppressed).toLocaleString("tr-TR")}`
                      : "—"}
                  </Td>
                  <Td right>{row.uniqueUsers}</Td>
                  <Td right>
                    {row.lastSeenAt
                      ? new Date(row.lastSeenAt).toLocaleString("tr-TR")
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnomalySection>

      <AnomalySection
        icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        title="İlerleme bütünlüğü"
        description="`hearts` 0–5 aralığı dışında, `points` veya `istikrar` negatifse bir kod yolu defansını kaybetmiş demektir. Sıfır olmalı."
        emptyText="İlerleme kayıtları sınırlar içinde."
      >
        {progressIntegrityRows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kullanıcı</Th>
                <Th>Sebep</Th>
                <Th right>Hearts</Th>
                <Th right>Points</Th>
                <Th right>İstikrar</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {progressIntegrityRows.map((row) => (
                <tr key={row.userId} className="hover:bg-muted/40">
                  <td className="px-4 py-2">
                    <UserCell name={row.name} email={row.email} userId={row.userId} />
                  </td>
                  <Td>
                    <code className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">
                      {row.reason}
                    </code>
                  </Td>
                  <Td right>{row.hearts}</Td>
                  <Td right>{Number(row.points ?? 0).toLocaleString("tr-TR")}</Td>
                  <Td right>{row.istikrar}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnomalySection>
    </div>
  );
}

function extractRows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object" && "rows" in res) {
    const rows = (res as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

function AnomalySection({
  icon,
  title,
  description,
  emptyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const empty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <header className="flex items-start gap-3 border-b px-5 py-3">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        {empty ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2 text-xs font-semibold ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  strong,
}: {
  children: React.ReactNode;
  right?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2 ${right ? "text-right" : ""} ${
        strong ? "font-semibold text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </td>
  );
}

function UserCell({
  name,
  email,
  userId,
}: {
  name: string | null;
  email: string | null;
  userId: string;
}) {
  const display = name?.trim() || email || userId.slice(0, 8);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-foreground">{display}</span>
      <Link
        href={`/admin/audit?actor=${encodeURIComponent(email ?? "")}`}
        className="text-[11px] text-muted-foreground hover:text-foreground"
      >
        {email ?? userId}
      </Link>
    </div>
  );
}
