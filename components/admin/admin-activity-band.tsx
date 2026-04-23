import Link from "next/link";
import db from "@/db/drizzle";
import { ArrowRight } from "lucide-react";

type ActivityItem = {
  id: number | string;
  href: string;
  title: string;
  subtitle: string;
  status: string;
};

export async function AdminActivityBand() {
  const [recentTeachers, recentStudents] = await Promise.all([
    db.query.teacherApplications.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 6,
    }),
    db.query.privateLessonApplications.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 6,
    }),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ActivityPanel
        title="Son Öğretmen Başvuruları"
        viewAllHref="/admin/teacher-applications"
        items={recentTeachers.map((app) => ({
          id: app.id,
          href: `/admin/teacher-applications#${app.id}`,
          title:
            `${app.teacherName ?? ""} ${app.teacherSurname ?? ""}`.trim() ||
            "İsimsiz",
          subtitle: `${app.field ?? "—"} · ${formatDate(app.createdAt)}`,
          status: app.status ?? "pending",
        }))}
      />
      <ActivityPanel
        title="Son Öğrenci Başvuruları"
        viewAllHref="/admin/student-applications"
        items={recentStudents.map((app) => ({
          id: app.id,
          href: `/admin/student-applications#${app.id}`,
          title:
            `${app.studentName ?? ""} ${app.studentSurname ?? ""}`.trim() ||
            "İsimsiz",
          subtitle: `${app.field ?? "—"} · ${formatDate(app.createdAt)}`,
          status: app.status ?? "pending",
        }))}
      />
    </div>
  );
}

export function AdminActivityBandSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((panel) => (
        <div
          key={panel}
          className="rounded-xl border bg-white shadow-sm animate-pulse"
        >
          <div className="px-5 py-4 border-b">
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel({
  title,
  viewAllHref,
  items,
}: {
  title: string;
  viewAllHref: string;
  items: ActivityItem[];
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <Link
          href={viewAllHref}
          className="text-sm text-lime-600 hover:underline"
        >
          Tümünü gör
        </Link>
      </div>
      <div className="divide-y">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 py-4">Henüz başvuru yok.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </div>
            </Link>
          ))
        )}
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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR");
}
