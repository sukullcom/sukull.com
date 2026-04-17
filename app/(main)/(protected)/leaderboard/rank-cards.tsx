"use client";

import { Trophy, School, Users } from "lucide-react";

type RankCardsProps = {
  userRank: number | null;
  schoolRank: number | null;
  userRankInSchool: number | null;
};

const cards = [
  {
    key: "user" as const,
    label: "Öğrenci Sıran",
    icon: Trophy,
    iconColor: "text-blue-500",
    bgIcon: "text-blue-100",
    valueColor: "text-blue-600",
  },
  {
    key: "school" as const,
    label: "Okul Sırası",
    icon: School,
    iconColor: "text-emerald-500",
    bgIcon: "text-emerald-100",
    valueColor: "text-emerald-600",
  },
  {
    key: "inSchool" as const,
    label: "Okuldaki Sıran",
    icon: Users,
    iconColor: "text-amber-500",
    bgIcon: "text-amber-100",
    valueColor: "text-amber-600",
  },
];

export const RankCards = ({
  userRank,
  schoolRank,
  userRankInSchool,
}: RankCardsProps) => {
  const values: Record<string, number | null> = {
    user: userRank,
    school: schoolRank,
    inSchool: userRankInSchool,
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg mx-auto mb-6 px-1">
      {cards.map(({ key, label, icon: Icon, iconColor, bgIcon, valueColor }) => (
        <div
          key={key}
          className="relative overflow-hidden border-2 border-gray-200 rounded-2xl p-3 sm:p-4"
        >
          <Icon className={`absolute -top-1 -right-1 h-10 w-10 sm:h-12 sm:w-12 ${bgIcon}`} />
          <div className={`${iconColor} mb-1`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 leading-tight">
            {label}
          </p>
          <p className={`text-xl sm:text-3xl font-extrabold mt-1 ${valueColor}`}>
            {values[key] ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
};
