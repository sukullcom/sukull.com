import Image from "next/image";
import {
  UsersRound,
  Flame,
  TrendingUp,
  Target,
  Trophy,
  BookOpen,
  Gamepad2,
  Shield,
  CreditCard,
  LineChart as LineChartIcon,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  getOverviewMetrics,
  getDailyActiveUsers,
  getNewSignups,
  getLearningMetrics,
  getGameMetrics,
  getStreakMetrics,
  getRevenueMetrics,
  getTopUsersTable,
  getPageViewMetrics,
} from "@/actions/admin-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GAME_LABELS: Record<string, string> = {
  snakable: "Snakable",
  "pattern-memory": "Sıralama Ustası",
  stroop: "Renk Tuzağı",
  "color-stroop": "Renk Tuzağı",
  "memory-match": "Hafıza Kartları",
  "memory-matrix": "Hafıza Matrisi",
  subscribe: "SubScribe",
  SubScribe: "SubScribe",
  "true-false": "Doğru mu Yanlış mı?",
  "speed-math": "Hız Matematiği",
  "human-body": "İnsan Vücudu",
  "journey-of-food": "Besinin Yolculuğu",
};

export default async function AdminAnalyticsPage() {
  const [
    overview,
    dau,
    signups,
    learning,
    gameStats,
    streaks,
    revenue,
    topUsers,
    pageViews,
  ] = await Promise.all([
    getOverviewMetrics(),
    getDailyActiveUsers(30),
    getNewSignups(7),
    getLearningMetrics(),
    getGameMetrics(),
    getStreakMetrics(),
    getRevenueMetrics(),
    getTopUsersTable(20),
    getPageViewMetrics(7),
  ]);

  const metricCards = [
    {
      label: "Toplam Kullanıcı",
      value: overview.totalUsers,
      icon: UsersRound,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Bugün Aktif",
      value: overview.todayActiveUsers,
      icon: Activity,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Haftalık Aktif",
      value: overview.weekActiveUsers,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      label: "Ortalama İstikrar",
      value: overview.avgStreak,
      icon: Flame,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "Bugünkü Puan",
      value: overview.totalPointsToday.toLocaleString("tr-TR"),
      icon: Sparkles,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Yeni Kayıt (7 gün)",
      value: overview.newUsers7d,
      icon: UsersRound,
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ];

  const maxDau = Math.max(1, ...dau.map((d) => d.users));
  const maxSignups = Math.max(1, ...signups.map((s) => s.count));
  const maxGameSessions = Math.max(1, ...gameStats.games.map((g) => g.sessions));
  const maxCourseCompletions = Math.max(
    1,
    ...learning.topCourses.map((c) => c.completions)
  );
  const maxPageViews = Math.max(1, ...pageViews.map((p) => p.views));

  const streakTotal =
    streaks.distribution.zero +
    streaks.distribution.oneToSeven +
    streaks.distribution.eightToThirty +
    streaks.distribution.thirtyPlus;

  function streakPercent(n: number) {
    return streakTotal > 0 ? Math.round((n / streakTotal) * 100) : 0;
  }

  function formatDateShort(iso: string) {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LineChartIcon className="h-7 w-7 text-gray-700" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Analitik
        </h1>
      </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {metricCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <Icon className="h-5 w-5 mb-2 opacity-70" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* DAU Chart */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-800">
                Günlük Aktif Kullanıcı (30 gün)
              </h2>
            </div>
            {dau.length === 0 ? (
              <p className="text-sm text-gray-400">Henüz veri yok.</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {dau.map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div
                      className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors"
                      style={{
                        height: `${Math.max(2, (d.users / maxDau) * 100)}%`,
                      }}
                      title={`${d.date}: ${d.users} kullanıcı`}
                    />
                    <div className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                      {d.date}: {d.users}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{dau[0] ? formatDateShort(dau[0].date) : "-"}</span>
              <span>
                {dau[dau.length - 1]
                  ? formatDateShort(dau[dau.length - 1].date)
                  : "-"}
              </span>
            </div>
          </div>

          {/* Signups Chart */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <UsersRound className="h-5 w-5 text-rose-600" />
              <h2 className="font-semibold text-gray-800">
                Yeni Kayıtlar (7 gün)
              </h2>
            </div>
            {signups.length === 0 ? (
              <p className="text-sm text-gray-400">Henüz veri yok.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {signups.map((s) => (
                  <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-semibold text-gray-600">
                      {s.count}
                    </div>
                    <div
                      className="w-full bg-rose-400 rounded-t"
                      style={{
                        height: `${Math.max(2, (s.count / maxSignups) * 100)}%`,
                      }}
                    />
                    <div className="text-xs text-gray-500">
                      {formatDateShort(s.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Learning + Games row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Learning Metrics */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-sky-600" />
              <h2 className="font-semibold text-gray-800">Öğrenme Metrikleri</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatBox
                label="Tamamlanan"
                value={learning.totalCompleted}
                color="text-sky-700 bg-sky-50 border-sky-200"
              />
              <StatBox
                label="Doğru Cevap"
                value={learning.totalCorrect}
                color="text-green-700 bg-green-50 border-green-200"
              />
              <StatBox
                label="Doğruluk"
                value={`%${learning.accuracy}`}
                color="text-emerald-700 bg-emerald-50 border-emerald-200"
              />
            </div>

            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              En popüler kurslar
            </h3>
            <div className="space-y-2">
              {learning.topCourses.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz veri yok.</p>
              ) : (
                learning.topCourses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    {c.imageSrc ? (
                      <Image
                        src={c.imageSrc}
                        alt={c.title}
                        width={24}
                        height={24}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium text-gray-700">
                          {c.title}
                        </span>
                        <span className="text-gray-500 ml-2">
                          {c.completions}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{
                            width: `${(c.completions / maxCourseCompletions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Game Metrics */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-5 w-5 text-violet-600" />
              <h2 className="font-semibold text-gray-800">Oyun Metrikleri</h2>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <Trophy className="h-4 w-4 text-amber-500" />
              Toplam oyun oturumu:
              <span className="font-bold text-gray-900">
                {gameStats.totalSessions.toLocaleString("tr-TR")}
              </span>
            </div>

            <div className="space-y-2">
              {gameStats.games.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz oyun oturumu yok.</p>
              ) : (
                gameStats.games.map((g) => (
                  <div key={g.name} className="flex items-center gap-3">
                    <div className="w-28 text-sm text-gray-700 truncate">
                      {GAME_LABELS[g.name] || g.name}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{
                          width: `${(g.sessions / maxGameSessions) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-gray-700 w-12 text-right">
                      {g.sessions}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Streaks + Revenue row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Streak Distribution */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-gray-800">İstikrar Dağılımı</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatBox
                label="Bugünkü hedef tamamlayan"
                value={streaks.targetsAchievedToday}
                color="text-emerald-700 bg-emerald-50 border-emerald-200"
              />
              <StatBox
                label="Toplam donma hakkı"
                value={streaks.totalStreakFreezes}
                color="text-cyan-700 bg-cyan-50 border-cyan-200"
              />
            </div>

            <div className="space-y-3">
              <StreakBar
                label="İstikrarsız (0)"
                value={streaks.distribution.zero}
                percent={streakPercent(streaks.distribution.zero)}
                color="bg-neutral-300"
              />
              <StreakBar
                label="1-7 gün"
                value={streaks.distribution.oneToSeven}
                percent={streakPercent(streaks.distribution.oneToSeven)}
                color="bg-amber-400"
              />
              <StreakBar
                label="8-30 gün"
                value={streaks.distribution.eightToThirty}
                percent={streakPercent(streaks.distribution.eightToThirty)}
                color="bg-orange-500"
              />
              <StreakBar
                label="30+ gün"
                value={streaks.distribution.thirtyPlus}
                percent={streakPercent(streaks.distribution.thirtyPlus)}
                color="bg-red-500"
              />
            </div>
          </div>

          {/* Revenue */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">Gelir ve Abonelik</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatBox
                label="Aktif abone"
                value={revenue.activeSubscriptions}
                color="text-green-700 bg-green-50 border-green-200"
              />
              <StatBox
                label="Başarılı ödeme"
                value={revenue.successfulPayments}
                color="text-emerald-700 bg-emerald-50 border-emerald-200"
              />
              <StatBox
                label="Satılan kredi"
                value={revenue.totalCreditsPurchased}
                color="text-teal-700 bg-teal-50 border-teal-200"
              />
            </div>

            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Son işlemler
            </h3>
            <div className="space-y-1 max-h-48 overflow-auto">
              {revenue.recentTransactions.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz işlem yok.</p>
              ) : (
                revenue.recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                  >
                    <span className="text-gray-700 truncate max-w-[140px]">
                      {t.userId.slice(0, 8)}...
                    </span>
                    <span className="text-gray-500">
                      {t.credits} kredi / {t.amount} ₺
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === "success"
                          ? "bg-green-100 text-green-800"
                          : t.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Page Views + Top Users row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Page views */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-800">
                Sayfa görüntüleme (page_view, 7 gün)
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Yalnızca <code className="text-[11px]">/learn</code> merkezinden,
              kullanıcı başı günde en fazla bir kez. Oyun, ders tamamlama ve
              mağaza olayları ayrı (DAU/özet tüm <code className="text-[11px]">activity_log</code>).
            </p>
            <div className="space-y-2">
              {pageViews.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz veri yok.</p>
              ) : (
                pageViews.map((p) => (
                  <div key={p.page} className="flex items-center gap-3">
                    <div className="w-44 text-xs text-gray-700 truncate font-mono">
                      {p.page}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${(p.views / maxPageViews) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 w-24 text-right">
                      {p.views} / {p.uniqueUsers}k
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Görüntülenme / tekil kullanıcı
            </p>
          </div>

          {/* Top Users */}
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-gray-800">
                En Aktif Kullanıcılar
              </h2>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-white">
                  <tr>
                    <th className="text-left py-2 font-medium">Kullanıcı</th>
                    <th className="text-right py-2 font-medium">Puan</th>
                    <th className="text-right py-2 font-medium">İstikrar</th>
                    <th className="text-right py-2 font-medium">Ders</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        Henüz veri yok.
                      </td>
                    </tr>
                  ) : (
                    topUsers.map((u, i) => (
                      <tr key={u.userId} className="border-t">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5">
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-800 truncate max-w-[150px]">
                              {u.userName || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-2 font-semibold text-emerald-600">
                          {u.points.toLocaleString("tr-TR")}
                        </td>
                        <td className="text-right py-2 text-orange-600">
                          {u.istikrar}
                        </td>
                        <td className="text-right py-2 text-gray-600">
                          {u.completedChallenges}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mt-4">
        <Shield className="h-3 w-3" />
        Admin&apos;e özel. Sunucu tarafında render edilir.
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function StreakBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {value} (%{percent})
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
