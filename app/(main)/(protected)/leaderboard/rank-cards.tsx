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
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-200",
  },
  {
    key: "school" as const,
    label: "Okul Sırası",
    icon: School,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-200",
  },
  {
    key: "inSchool" as const,
    label: "Okuldaki Sıran",
    icon: Users,
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-200",
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
      {cards.map(({ key, label, icon: Icon, gradient, shadow }) => (
        <div
          key={key}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-3 sm:p-4 text-white shadow-lg ${shadow} transition-transform hover:scale-105`}
        >
          <Icon className="absolute -top-1 -right-1 h-10 w-10 sm:h-12 sm:w-12 opacity-15" />
          <p className="text-[10px] sm:text-[11px] font-medium opacity-90 leading-tight">
            {label}
          </p>
          <p className="text-xl sm:text-3xl font-extrabold mt-1">
            {values[key] ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
};
