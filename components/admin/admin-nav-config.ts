import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  School,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Eğer bir sayı döndürülürse sidebar'da küçük rozet olarak gösterilir. */
  badgeKey?: "teacherPending" | "listingsPendingReview" | "errors24h";
};

/**
 * Admin panelinin tek doğruluk kaynağı olan route listesi.
 * Hem sidebar hem breadcrumb hem de dashboard navigation bunu okur.
 *
 * Marketplace refactor'undan sonra "Öğrenci Başvuruları" ve
 * "Öğrenci Rolü Onarımı" sekmeleri kaldırıldı; yerine açık öğrenci
 * ilanları rozetiyle birlikte genel "İlanlar" sekmesi geldi.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
  {
    href: "/admin/teacher-applications",
    label: "Eğitmen Başvuruları",
    icon: School,
    badgeKey: "teacherPending",
  },
  {
    href: "/admin/listings",
    label: "Özel Ders İlanları",
    icon: Megaphone,
    badgeKey: "listingsPendingReview",
  },
  { href: "/admin/course-builder", label: "Kurs Oluşturucu", icon: BookOpen },
  { href: "/admin/schools", label: "Okul Yönetimi", icon: GraduationCap },
  { href: "/admin/credits", label: "Kredi Yönetimi", icon: CreditCard },
  {
    href: "/admin/errors",
    label: "Hata Kayıtları",
    icon: AlertTriangle,
    badgeKey: "errors24h",
  },
  { href: "/admin/anomalies", label: "Anomali İzleme", icon: ShieldAlert },
  { href: "/admin/notifications", label: "Bildirim Tanısı", icon: Bell },
  { href: "/admin/audit", label: "Yönetici Günlüğü", icon: ShieldCheck },
];

export type AdminNavBadges = Partial<Record<NonNullable<AdminNavItem["badgeKey"]>, number>>;

export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  const sorted = [...ADMIN_NAV].sort((a, b) => b.href.length - a.href.length);
  return sorted.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
