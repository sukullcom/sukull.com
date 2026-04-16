"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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
} from "lucide-react";

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
  city?: string;
};

type SchoolType =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

const TABS = [
  { id: "users" as const, label: "Bireysel", icon: User },
  { id: "university" as const, label: "Üniversiteler", icon: GraduationCap },
  { id: "high_school" as const, label: "Liseler", icon: School },
  { id: "secondary_school" as const, label: "Ortaokullar", icon: BookOpen },
  { id: "elementary_school" as const, label: "İlkokullar", icon: Pencil },
] as const;

type TabId = (typeof TABS)[number]["id"];

type LeaderboardClientProps = {
  initialUsers: UserEntry[];
  initialSchools: Record<SchoolType, SchoolEntry[]>;
  currentUserId: string | null;
  currentSchoolId: number | null;
  cities: string[];
};

export const LeaderboardClient = ({
  initialUsers,
  initialSchools,
  currentUserId,
  currentSchoolId,
  cities,
}: LeaderboardClientProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState(initialUsers);
  const [schoolData, setSchoolData] = useState(initialSchools);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loadingMore, startLoadMore] = useTransition();
  const [hasMoreUsers, setHasMoreUsers] = useState(initialUsers.length >= 50);
  const [hasMoreSchools, setHasMoreSchools] = useState<Record<SchoolType, boolean>>({
    university: initialSchools.university.length >= 50,
    high_school: initialSchools.high_school.length >= 50,
    secondary_school: initialSchools.secondary_school.length >= 50,
    elementary_school: initialSchools.elementary_school.length >= 50,
  });
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
            limit: "50",
          });
          if (city) params.set("city", city);

          const res = await fetch(`/api/schools?${params}`);
          const data = await res.json();
          const mapped = (data.schools || []).map((s: { id: number; name: string; totalPoints: number; city?: string }) => ({
            schoolId: s.id,
            schoolName: s.name,
            totalPoints: s.totalPoints,
            city: s.city,
          }));
          setSchoolData((prev) => ({ ...prev, [currentSchoolType]: mapped }));
          setHasMoreSchools((prev) => ({
            ...prev,
            [currentSchoolType]: mapped.length >= 50,
          }));
        } catch {
          /* silently ignore */
        }
      });
    },
    [currentSchoolType],
  );

  useEffect(() => {
    setSelectedCity("");
  }, [activeTab]);

  const loadMoreUsers = () => {
    startLoadMore(async () => {
      try {
        const res = await fetch(
          `/api/leaderboard?limit=25&offset=${users.length}`,
        );
        const data = await res.json();
        const newUsers: UserEntry[] = data.users || [];
        if (newUsers.length < 25) setHasMoreUsers(false);
        setUsers((prev) => [...prev, ...newUsers]);
      } catch {
        /* ignore */
      }
    });
  };

  const loadMoreSchools = () => {
    if (!currentSchoolType) return;
    const current = schoolData[currentSchoolType];
    startLoadMore(async () => {
      try {
        const params = new URLSearchParams({
          action: "leaderboard",
          type: currentSchoolType,
          limit: "25",
          offset: String(current.length),
        });
        if (selectedCity) params.set("city", selectedCity);

        const res = await fetch(`/api/schools?${params}`);
        const data = await res.json();
        const newSchools: SchoolEntry[] = (data.schools || []).map(
          (s: { id: number; name: string; totalPoints: number; city?: string }) => ({
            schoolId: s.id,
            schoolName: s.name,
            totalPoints: s.totalPoints,
            city: s.city,
          }),
        );
        if (newSchools.length < 25) {
          setHasMoreSchools((prev) => ({
            ...prev,
            [currentSchoolType]: false,
          }));
        }
        setSchoolData((prev) => ({
          ...prev,
          [currentSchoolType]: [...current, ...newSchools],
        }));
      } catch {
        /* ignore */
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
                  "flex items-center w-full px-3 py-2.5 rounded-xl mb-1.5 transition-colors",
                  isMe
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : rank % 2 === 0
                      ? "bg-gray-50"
                      : "bg-white",
                )}
              >
                <span className="w-8 text-center font-bold text-sm text-neutral-400 shrink-0">
                  {rank}
                </span>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 mx-2 shrink-0 border bg-green-500">
                  <AvatarImage src={u.userImageSrc} className="object-cover" />
                  <AvatarFallback>{u.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm text-neutral-800 flex-1 truncate mr-2">
                  {u.userName}
                </p>
                <p className="text-xs sm:text-sm text-neutral-500 shrink-0 font-medium">
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
    return (
      <>
        {items.map((s, i) => {
          const rank = i + 4;
          const isMine = s.schoolId === currentSchoolId;
          return (
            <div
              key={s.schoolId}
              className={cn(
                "flex items-center w-full px-3 py-2.5 rounded-xl mb-1.5 transition-colors",
                isMine
                  ? "bg-emerald-50 border-l-4 border-emerald-500"
                  : rank % 2 === 0
                    ? "bg-gray-50"
                    : "bg-white",
              )}
            >
              <span className="w-8 text-center font-bold text-sm text-neutral-400 shrink-0">
                {rank}
              </span>
              <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 mx-2 shrink-0 rounded-full bg-emerald-100">
                <School className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0 mr-2">
                <p className="font-semibold text-sm text-neutral-800 truncate">
                  {s.schoolName}
                </p>
                {s.city && (
                  <p className="text-[11px] text-neutral-400 truncate">
                    {s.city}
                  </p>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 shrink-0 font-medium">
                {s.totalPoints.toLocaleString("tr-TR")} Puan
              </p>
            </div>
          );
        })}
        {currentSchoolType && hasMoreSchools[currentSchoolType] && (
          <LoadMoreButton loading={loadingMore} onClick={loadMoreSchools} />
        )}
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
    return schoolData[type].slice(0, 3).map((s) => ({
      id: s.schoolId,
      name: s.schoolName,
      points: s.totalPoints,
    }));
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Tab Bar */}
      <div
        className="flex bg-gray-100 rounded-xl p-1 gap-0.5 mb-5 overflow-x-auto scrollbar-hide"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center justify-center gap-1 sm:gap-1.5 flex-1 px-2.5 sm:px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0",
              activeTab === id
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* City filter (school tabs only) */}
      {isSchoolTab && cities.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-neutral-700 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              <option value="">Tüm Türkiye</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
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
