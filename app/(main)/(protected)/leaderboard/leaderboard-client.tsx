"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Podium } from "./podium";
import {
  User,
  GraduationCap,
  School,
  BookOpen,
  Pencil,
  MapPin,
  ChevronDown,
  Loader2,
  Info,
  Users,
} from "lucide-react";
import type { LeaderboardSchoolTab } from "@/lib/learning-path";
import { fetchSchoolCatalogJson } from "@/lib/fetch-school-catalog";
import { SCHOOL_LEADERBOARD_LIST_MAX } from "@/lib/school-leaderboard-limits";
import { toast } from "sonner";
import { clientLogger } from "@/lib/client-logger";
import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";

type UserEntry = {
  userId: string;
  userName: string;
  userImageSrc: string;
  points: number;
};

type SchoolEntry = {
  schoolId: number;
  schoolName: string;
  totalPoints: number;
  /** Bayesian shrinkage uygulanmış skor — sıralama bu değerle yapılır. */
  topAvgScore: number;
  /** Aktif öğrenci sayısı (son 30 gün). Tie-breaker ve gösterim için. */
  activeStudentCount: number;
  /** Puanı > 0 olan kayıtlı öğrenci sayısı. */
  pointingStudentCount?: number;
  rawAvgPoints?: number;
  city?: string;
};

type SchoolsLeaderboardJson = {
  schools: Array<{
    id: number;
    name: string;
    totalPoints: number;
    topAvgScore: number;
    rawAvgPoints?: number;
    activeStudentCount: number;
    pointingStudentCount?: number;
    city?: string;
  }>;
};

function schoolMemberLabel(s: SchoolEntry): string {
  if (s.activeStudentCount > 0) {
    return `${s.activeStudentCount.toLocaleString("tr-TR")} aktif`;
  }
  const pointed = s.pointingStudentCount ?? 0;
  if (pointed > 0) {
    return `${pointed.toLocaleString("tr-TR")} puanlı`;
  }
  return "0 aktif";
}

const TABS = [
  { id: "users" as const, label: "Bireysel", icon: User },
  { id: "university" as const, label: "Üniversiteler", icon: GraduationCap },
  { id: "high_school" as const, label: "Liseler", icon: School },
  { id: "secondary_school" as const, label: "Ortaokullar", icon: BookOpen },
  { id: "elementary_school" as const, label: "İlkokullar", icon: Pencil },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SchoolType =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

type LeaderboardClientProps = {
  initialUsers: UserEntry[];
  initialSchools: Record<SchoolType, SchoolEntry[]>;
  currentUserId: string | null;
  currentSchoolId: number | null;
  cities: string[];
  /** Öğrenme yoluna göre gösterilecek okul tipi sekmeleri; `all` = mevcut davranış. */
  visibleSchoolTabs: LeaderboardSchoolTab[] | "all";
};

export const LeaderboardClient = ({
  initialUsers,
  initialSchools,
  currentUserId,
  currentSchoolId,
  cities,
  visibleSchoolTabs,
}: LeaderboardClientProps) => {
  const tabsToShow = useMemo(() => {
    if (visibleSchoolTabs === "all") return [...TABS];
    const allow = new Set<string>(["users", ...visibleSchoolTabs]);
    return TABS.filter((t) => allow.has(t.id));
  }, [visibleSchoolTabs]);

  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState(initialUsers);
  const [schoolData, setSchoolData] = useState(initialSchools);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loadingMore, startLoadMore] = useTransition();
  const [hasMoreUsers, setHasMoreUsers] = useState(initialUsers.length >= 50);
  const [cityLoading, startCityLoad] = useTransition();

  const isSchoolTab = activeTab !== "users";
  const currentSchoolType = isSchoolTab ? (activeTab as SchoolType) : null;

  const handleCityChange = useCallback(
    (city: string) => {
      setSelectedCity(city);
      startCityLoad(async () => {
        if (!currentSchoolType) return;
        try {
          const params = new URLSearchParams({
            action: "leaderboard",
            type: currentSchoolType,
            limit: String(SCHOOL_LEADERBOARD_LIST_MAX),
          });
          if (city) params.set("city", city);

          const r = await fetchSchoolCatalogJson<SchoolsLeaderboardJson>(
            `/api/schools?${params.toString()}`,
            "Puan tablosu",
          );
          if (!r.ok) {
            toast.error(r.message);
            clientLogger.error({
              message: "leaderboard city filter fetch failed",
              location: "leaderboard-client/handleCityChange",
              fields: { detail: r.message, type: currentSchoolType, city },
            });
            return;
          }
          const mapped = (r.data.schools || []).map((s) => ({
            schoolId: s.id,
            schoolName: s.name,
            totalPoints: s.totalPoints,
            topAvgScore: s.topAvgScore,
            rawAvgPoints: s.rawAvgPoints,
            activeStudentCount: s.activeStudentCount,
            pointingStudentCount: s.pointingStudentCount,
            city: s.city,
          }));
          setSchoolData((prev) => ({ ...prev, [currentSchoolType]: mapped }));
        } catch (e) {
          clientLogger.error({
            message: "leaderboard city filter unexpected error",
            error: e,
            location: "leaderboard-client/handleCityChange",
          });
          toast.error("Puan tablosu güncellenemedi. Lütfen tekrar deneyin.");
        }
      });
    },
    [currentSchoolType],
  );

  useEffect(() => {
    setSelectedCity("");
  }, [activeTab]);

  useEffect(() => {
    const ids = new Set(tabsToShow.map((t) => t.id));
    if (!ids.has(activeTab)) {
      setActiveTab("users");
    }
  }, [tabsToShow, activeTab]);

  const loadMoreUsers = () => {
    startLoadMore(async () => {
      try {
        const res = await fetch(
          `/api/leaderboard?limit=25&offset=${users.length}`,
        );
        if (!res.ok) {
          const msg =
            res.status === 429
              ? "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin."
              : "Liste yüklenemedi. Lütfen tekrar deneyin.";
          toast.error(msg);
          return;
        }
        const data = await res.json();
        const newUsers: UserEntry[] = data.users || [];
        if (newUsers.length < 25) setHasMoreUsers(false);
        setUsers((prev) => [...prev, ...newUsers]);
      } catch (e) {
        toast.error(getClientAuthTransientErrorMessage(e));
        clientLogger.error({
          message: "load more users failed",
          error: e,
          location: "leaderboard-client/loadMoreUsers",
        });
      }
    });
  };

  const renderList = () => {
    if (activeTab === "users") {
      const items = users.slice(3);
      return (
        <>
          {items.map((u, i) => {
            const rank = i + 4;
            const isMe = u.userId === currentUserId;
            return (
              <div
                key={u.userId}
                className={cn(
                  "flex items-center w-full px-3 py-2.5 border-b border-gray-100 transition-colors",
                  isMe && "bg-blue-50 border-l-4 border-l-blue-500",
                )}
              >
                <span className="w-8 text-center font-bold text-sm text-muted-foreground shrink-0">
                  {rank}
                </span>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 mx-2 shrink-0 border bg-green-500">
                  <AvatarImage src={u.userImageSrc} className="object-cover" />
                  <AvatarFallback>{u.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm text-foreground flex-1 truncate mr-2">
                  {u.userName}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground shrink-0 font-medium">
                  {u.points.toLocaleString("tr-TR")} Puan
                </p>
              </div>
            );
          })}
          {hasMoreUsers && (
            <LoadMoreButton loading={loadingMore} onClick={loadMoreUsers} />
          )}
        </>
      );
    }

    const type = activeTab as SchoolType;
    const items = schoolData[type].slice(3);
    if (items.length === 0 && schoolData[type].length === 0) {
      return (
        <div className="text-center py-10 px-4 text-sm text-muted-foreground">
          <School className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Bu kategoride henüz yeterli okul yok.</p>
          <p className="text-xs mt-1">
            Bu kategoride puanı olan en az bir öğrencisi kayıtlı okul
            bulunamadı.
          </p>
        </div>
      );
    }
    return (
      <>
        {items.map((s, i) => {
          const rank = i + 4;
          const isMine = s.schoolId === currentSchoolId;
          return (
            <div
              key={s.schoolId}
              className={cn(
                "flex items-center w-full px-3 py-2.5 border-b border-gray-100 transition-colors",
                isMine && "bg-emerald-50 border-l-4 border-l-emerald-500",
              )}
            >
              <span className="w-8 text-center font-bold text-sm text-muted-foreground shrink-0">
                {rank}
              </span>
              <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 mx-2 shrink-0 rounded-full bg-emerald-100">
                <School className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0 mr-2">
                <p className="font-semibold text-sm text-foreground truncate">
                  {s.schoolName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                  {s.city && <span className="truncate">{s.city}</span>}
                  {s.city && <span aria-hidden>·</span>}
                  <span className="inline-flex items-center gap-0.5 shrink-0">
                    <Users className="h-3 w-3" />
                    {schoolMemberLabel(s)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Skor
                </p>
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {Math.round(s.topAvgScore).toLocaleString("tr-TR")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Toplam: {s.totalPoints.toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const podiumEntries = () => {
    if (activeTab === "users") {
      return users.slice(0, 3).map((u) => ({
        id: u.userId,
        name: u.userName,
        points: u.points,
        imageSrc: u.userImageSrc,
      }));
    }
    const type = activeTab as SchoolType;
    // Podyumda da Bayesian skoru gösteriyoruz (sıralama buna göre); sayı
    // okunaklı olsun diye yuvarlıyoruz.
    return schoolData[type].slice(0, 3).map((s) => ({
      id: s.schoolId,
      name: s.schoolName,
      points: Math.round(s.topAvgScore),
    }));
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Tab Bar */}
      <div
        className="flex border-2 border-border rounded-2xl p-1 gap-0.5 mb-5 overflow-x-auto scrollbar-hide"
      >
        {tabsToShow.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center justify-center gap-1 sm:gap-1.5 flex-1 px-2.5 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all shrink-0",
              activeTab === id
                ? "bg-muted text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Okul sekmelerinde sıralama mantığını şeffafça anlatan bilgi şeridi.
          Bireysel sekme zaten direkt puan toplamına dayalı; açıklamaya gerek
          yok. */}
      {isSchoolTab && (
        <details className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
          <summary className="flex cursor-pointer items-center gap-1.5 font-medium select-none">
            <Info className="h-3.5 w-3.5" />
            Sıralama nasıl çalışıyor?
          </summary>
          <div className="mt-2 space-y-1.5 leading-relaxed">
            <p>
              Okullar büyüklüğe göre değil,{" "}
              <span className="font-semibold">
                aktif öğrencilerin ortalama puanına
              </span>{" "}
              göre sıralanır. Böylece 10 bin öğrencili bir okul, 200 öğrencili
              bir okulu sırf kalabalık olduğu için ezemez.
            </p>
            <p>
              Az aktif öğrencisi olan okullar, anormal değerlerden etkilenmemek
              için istatistiksel olarak ortalamaya çekilir (Bayesian smoothing).
              Listede, en az bir öğrencisinin puanı olan okullar yer alır;
              sıralama skoru son 30 günde aktif öğrencilerin ortalamasına
              dayanır.
            </p>
            <p>
              Eşit ortalamada{" "}
              <span className="font-semibold">aktif öğrenci sayısı</span> üstte
              olanı belirler. Aktif = son 30 günde ders/oyun tamamlamış.
            </p>
          </div>
        </details>
      )}

      {/* City filter (school tabs only) */}
      {isSchoolTab && cities.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              <option value="">Tüm Türkiye</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {cityLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
          )}
        </div>
      )}

      {/* Podium */}
      <Podium
        entries={podiumEntries()}
        variant={activeTab === "users" ? "user" : "school"}
      />

      {/* List */}
      <div className="mt-2">{renderList()}</div>
    </div>
  );
};

function LoadMoreButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center mt-4 mb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={loading}
        className="text-green-600 hover:text-green-700 gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Daha Fazla Göster
      </Button>
    </div>
  );
}
