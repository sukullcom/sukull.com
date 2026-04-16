export type SubjectColorConfig = {
  bg: string;
  bgDark: string;
  gradient: string;
  border: string;
  text: string;
  hex: string;
  hexDark: string;
};

const SUBJECT_COLOR_MAP: Record<string, SubjectColorConfig> = {
  Matematik: {
    bg: "bg-blue-500",
    bgDark: "bg-blue-700",
    gradient: "from-blue-500 to-indigo-600",
    border: "border-blue-600",
    text: "text-blue-500",
    hex: "#3b82f6",
    hexDark: "#1d4ed8",
  },
  "Türkçe": {
    bg: "bg-orange-500",
    bgDark: "bg-orange-700",
    gradient: "from-orange-500 to-amber-600",
    border: "border-orange-600",
    text: "text-orange-500",
    hex: "#f97316",
    hexDark: "#c2410c",
  },
  "Fen Bilimleri": {
    bg: "bg-emerald-500",
    bgDark: "bg-emerald-700",
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-600",
    text: "text-emerald-500",
    hex: "#10b981",
    hexDark: "#047857",
  },
  "İngilizce": {
    bg: "bg-rose-500",
    bgDark: "bg-rose-700",
    gradient: "from-rose-500 to-pink-600",
    border: "border-rose-600",
    text: "text-rose-500",
    hex: "#f43f5e",
    hexDark: "#be123c",
  },
  Fizik: {
    bg: "bg-cyan-500",
    bgDark: "bg-cyan-700",
    gradient: "from-cyan-500 to-sky-600",
    border: "border-cyan-600",
    text: "text-cyan-500",
    hex: "#06b6d4",
    hexDark: "#0e7490",
  },
  Kimya: {
    bg: "bg-violet-500",
    bgDark: "bg-violet-700",
    gradient: "from-violet-500 to-purple-600",
    border: "border-violet-600",
    text: "text-violet-500",
    hex: "#8b5cf6",
    hexDark: "#6d28d9",
  },
  Biyoloji: {
    bg: "bg-lime-500",
    bgDark: "bg-lime-700",
    gradient: "from-lime-500 to-green-600",
    border: "border-lime-600",
    text: "text-lime-600",
    hex: "#84cc16",
    hexDark: "#4d7c0f",
  },
  Tarih: {
    bg: "bg-amber-500",
    bgDark: "bg-amber-700",
    gradient: "from-amber-500 to-yellow-600",
    border: "border-amber-600",
    text: "text-amber-500",
    hex: "#f59e0b",
    hexDark: "#b45309",
  },
  "Sosyal Bilgiler": {
    bg: "bg-amber-500",
    bgDark: "bg-amber-700",
    gradient: "from-amber-500 to-yellow-600",
    border: "border-amber-600",
    text: "text-amber-500",
    hex: "#f59e0b",
    hexDark: "#b45309",
  },
  "Din Kültürü": {
    bg: "bg-slate-500",
    bgDark: "bg-slate-700",
    gradient: "from-slate-500 to-gray-600",
    border: "border-slate-600",
    text: "text-slate-500",
    hex: "#64748b",
    hexDark: "#334155",
  },
  Felsefe: {
    bg: "bg-slate-500",
    bgDark: "bg-slate-700",
    gradient: "from-slate-500 to-gray-600",
    border: "border-slate-600",
    text: "text-slate-500",
    hex: "#64748b",
    hexDark: "#334155",
  },
  "Coğrafya": {
    bg: "bg-teal-500",
    bgDark: "bg-teal-700",
    gradient: "from-teal-500 to-emerald-600",
    border: "border-teal-600",
    text: "text-teal-500",
    hex: "#14b8a6",
    hexDark: "#0f766e",
  },
};

const DEFAULT_COLOR: SubjectColorConfig = {
  bg: "bg-green-500",
  bgDark: "bg-green-700",
  gradient: "from-green-500 to-green-600",
  border: "border-green-600",
  text: "text-green-500",
  hex: "#22c55e",
  hexDark: "#15803d",
};

export function extractSubject(title: string): string {
  const t = title.toLocaleLowerCase("tr");
  if (t.includes("matematik")) return "Matematik";
  if (t.includes("türkçe") || t.includes("türk dili") || t.includes("edebiyat")) return "Türkçe";
  if (t.includes("fen bilimleri")) return "Fen Bilimleri";
  if (t.includes("fizik")) return "Fizik";
  if (t.includes("kimya")) return "Kimya";
  if (t.includes("biyoloji")) return "Biyoloji";
  if (t.includes("din kültürü") || t.includes("din kulturu")) return "Din Kültürü";
  if (t.includes("felsefe")) return "Felsefe";
  if (t.includes("inkılap") || t.includes("inkilap")) return "Tarih";
  if (t.includes("tarih")) return "Tarih";
  if (t.includes("coğrafya") || t.includes("cografya")) return "Coğrafya";
  if (t.includes("sosyal bilgiler")) return "Sosyal Bilgiler";
  if (t.includes("ingilizce") || t.includes("english")) return "İngilizce";
  return title.replace(/\d+\.\s*[Ss]ınıf\s*/, "").trim();
}

export function getSubjectColor(courseTitle: string): SubjectColorConfig {
  const subject = extractSubject(courseTitle);
  return SUBJECT_COLOR_MAP[subject] ?? DEFAULT_COLOR;
}
