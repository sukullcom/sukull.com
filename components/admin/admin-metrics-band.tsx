import db from "@/db/drizzle";
import {
  users,
  teacherApplications,
  privateLessonApplications,
} from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { UsersRound, Clock, CheckCircle, XCircle } from "lucide-react";

export async function AdminMetricsBand() {
  const [
    [totalUsersRow],
    [teacherPendingRow],
    [teacherApprovedRow],
    [teacherRejectedRow],
    [studentPendingRow],
    [studentApprovedRow],
    [studentRejectedRow],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(teacherApplications)
      .where(eq(teacherApplications.status, "pending")),
    db
      .select({ value: count() })
      .from(teacherApplications)
      .where(eq(teacherApplications.status, "approved")),
    db
      .select({ value: count() })
      .from(teacherApplications)
      .where(eq(teacherApplications.status, "rejected")),
    db
      .select({ value: count() })
      .from(privateLessonApplications)
      .where(sql`${privateLessonApplications.status} = 'pending'`),
    db
      .select({ value: count() })
      .from(privateLessonApplications)
      .where(sql`${privateLessonApplications.status} = 'approved'`),
    db
      .select({ value: count() })
      .from(privateLessonApplications)
      .where(sql`${privateLessonApplications.status} = 'rejected'`),
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

  const metricCards = [
    {
      label: "Toplam Kullanıcı",
      value: stats.totalUsers,
      icon: UsersRound,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Bekleyen Öğretmen",
      value: stats.teacherPending,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      label: "Onaylı Öğretmen",
      value: stats.teacherApproved,
      icon: CheckCircle,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: "Bekleyen Öğrenci",
      value: stats.studentPending,
      icon: Clock,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "Onaylı Öğrenci",
      value: stats.studentApproved,
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Reddedilen (Toplam)",
      value: stats.teacherRejected + stats.studentRejected,
      icon: XCircle,
      color: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {metricCards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-xl border p-4 ${color}`}>
          <Icon className="h-5 w-5 mb-2 opacity-70" />
          <p className="text-2xl font-bold">{value.toLocaleString("tr-TR")}</p>
          <p className="text-xs font-medium opacity-80 mt-1 leading-tight">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdminMetricsBandSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-4 bg-gray-50 border-gray-200 animate-pulse"
        >
          <div className="h-5 w-5 mb-2 bg-gray-200 rounded" />
          <div className="h-7 w-14 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
