import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users, teacherApplications, privateLessonApplications } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import {
  UsersRound,
  School,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (userRecord?.role !== "admin") redirect("/unauthorized");

  const [
    [totalUsersRow],
    [teacherPendingRow],
    [teacherApprovedRow],
    [teacherRejectedRow],
    [studentPendingRow],
    [studentApprovedRow],
    [studentRejectedRow],
    recentTeachers,
    recentStudents,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(teacherApplications).where(eq(teacherApplications.status, "pending")),
    db.select({ value: count() }).from(teacherApplications).where(eq(teacherApplications.status, "approved")),
    db.select({ value: count() }).from(teacherApplications).where(eq(teacherApplications.status, "rejected")),
    db.select({ value: count() }).from(privateLessonApplications).where(sql`${privateLessonApplications.status} = 'pending'`),
    db.select({ value: count() }).from(privateLessonApplications).where(sql`${privateLessonApplications.status} = 'approved'`),
    db.select({ value: count() }).from(privateLessonApplications).where(sql`${privateLessonApplications.status} = 'rejected'`),
    db.query.teacherApplications.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 5 }),
    db.query.privateLessonApplications.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 5 }),
  ]);

  const stats = {
    totalUsers: totalUsersRow?.value ?? 0,
    teacherPending: teacherPendingRow?.value ?? 0,
    teacherApproved: teacherApprovedRow?.value ?? 0,
    teacherRejected: teacherRejectedRow?.value ?? 0,
    studentPending: studentPendingRow?.value ?? 0,
    studentApproved: studentApprovedRow?.value ?? 0,
    studentRejected: studentRejectedRow?.value ?? 0,
  };

  const navLinks = [
    { href: "/admin/teacher-applications", label: "Öğretmen Başvuruları", icon: School, badge: stats.teacherPending },
    { href: "/admin/student-applications", label: "Öğrenci Başvuruları", icon: GraduationCap, badge: stats.studentPending },
    { href: "/admin/course-builder", label: "Kurs Oluşturucu", icon: BookOpen },
    { href: "/admin/fix-student-roles", label: "Kullanıcı Yönetimi", icon: UsersRound },
  ];

  const metricCards = [
    { label: "Toplam Kullanıcı", value: stats.totalUsers, icon: UsersRound, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Bekleyen Öğretmen", value: stats.teacherPending, icon: Clock, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { label: "Onaylı Öğretmen", value: stats.teacherApproved, icon: CheckCircle, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Bekleyen Öğrenci", value: stats.studentPending, icon: Clock, color: "bg-orange-50 text-orange-700 border-orange-200" },
    { label: "Onaylı Öğrenci", value: stats.studentApproved, icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Reddedilen (Toplam)", value: stats.teacherRejected + stats.studentRejected, icon: XCircle, color: "bg-red-50 text-red-700 border-red-200" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-7 w-7 text-gray-700" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {metricCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <Icon className="h-5 w-5 mb-2 opacity-70" />
              <p className="text-2xl font-bold">{value.toLocaleString("tr-TR")}</p>
              <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {navLinks.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md hover:border-lime-300 transition-all"
            >
              <Icon className="h-5 w-5 text-gray-500 group-hover:text-lime-600 transition-colors" />
              <span className="flex-1 font-medium text-sm text-gray-800">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                  {badge}
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-lime-600 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Teacher Applications */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Son Öğretmen Başvuruları</h2>
              <Link href="/admin/teacher-applications" className="text-sm text-lime-600 hover:underline">Tümünü gör</Link>
            </div>
            <div className="divide-y">
              {recentTeachers.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-4">Henüz başvuru yok.</p>
              ) : (
                recentTeachers.map((app) => (
                  <div key={app.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{app.teacherName} {app.teacherSurname}</p>
                      <p className="text-xs text-gray-500">{app.field} &middot; {app.createdAt ? new Date(app.createdAt).toLocaleDateString("tr-TR") : "-"}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Student Applications */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Son Öğrenci Başvuruları</h2>
              <Link href="/admin/student-applications" className="text-sm text-lime-600 hover:underline">Tümünü gör</Link>
            </div>
            <div className="divide-y">
              {recentStudents.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-4">Henüz başvuru yok.</p>
              ) : (
                recentStudents.map((app) => (
                  <div key={app.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{app.studentName} {app.studentSurname}</p>
                      <p className="text-xs text-gray-500">{app.field} &middot; {app.createdAt ? new Date(app.createdAt).toLocaleDateString("tr-TR") : "-"}</p>
                    </div>
                    <StatusBadge status={app.status ?? "pending"} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylı",
    rejected: "Reddedildi",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
