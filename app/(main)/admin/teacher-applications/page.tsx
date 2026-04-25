"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Check,
  X,
  User,
  BookOpen,
  Mail,
  Phone,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Briefcase,
  Monitor,
  Calendar,
  Wallet,
  FileText,
} from "lucide-react";
import { FieldSelector } from "./components/field-selector";

type TeacherApplication = {
  id: number;
  teacherName: string;
  teacherSurname: string;
  teacherEmail: string;
  teacherPhoneNumber: string;
  field: string;
  education: string | null;
  experienceYears: string | null;
  targetLevels: string | null;
  availableHours: string | null;
  lessonMode: string | null;
  hourlyRate: string | null;
  hourlyRateOnline: number | null;
  hourlyRateInPerson: number | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  quizResult: number;
  passed: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

type StatusCounts = Record<StatusFilter, number>;

type ApiResponse = {
  applications: TeacherApplication[];
  total: number;
  statusCounts: StatusCounts;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Admin listing of teacher applications.
 *
 * At 10K MAU the table easily crosses 1-5K rows; pulling the whole set
 * client-side like the previous version did costs seconds of JSON and
 * browser memory. This page requests one 20-row window at a time and
 * re-fetches on filter / search / page change. A debounced query param
 * keeps typing responsive without flooding the API.
 */
export default function TeacherApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // debounced
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [fieldSelector, setFieldSelector] = useState<{
    isOpen: boolean;
    applicationId: number | null;
    teacherName: string;
  }>({ isOpen: false, applicationId: null, teacherName: "" });

  // Debounce the search input to one API call ~300ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever the filter or search changes; pagination
  // state for a non-existent window would just show an empty list.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // Abort in-flight fetches when inputs change again quickly.
  const abortRef = useRef<AbortController | null>(null);

  const fetchApplications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "teacher-applications",
        page: String(page),
        pageSize: String(PAGE_SIZE),
        status: statusFilter,
      });
      if (searchQuery) params.set("q", searchQuery);

      const response = await fetch(`/api/admin?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        if (!controller.signal.aborted) toast.error("Başvurular yüklenirken hata oluştu");
        return;
      }
      const data = (await response.json()) as ApiResponse;
      if (controller.signal.aborted) return;

      setApplications(data.applications ?? []);
      setTotal(data.total ?? 0);
      setStatusCounts(
        data.statusCounts ?? { all: 0, pending: 0, approved: 0, rejected: 0 },
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Başvurular yüklenirken hata oluştu");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
    return () => abortRef.current?.abort();
  }, [fetchApplications]);

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const action = status === "approved" ? "approve" : "reject";
      const response = await fetch(`/api/admin/teacher-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        toast.success(`Başvuru ${status === "approved" ? "onaylandı" : "reddedildi"}`);
        fetchApplications();
      } else {
        const err = await response.json();
        toast.error(`İşlem başarısız: ${err.message || "Bilinmeyen hata"}`);
      }
    } catch {
      toast.error("İşlem başarısız: Bağlantı hatası");
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  if (loading && applications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Öğretmen Başvuruları</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="İsim, e-posta veya alan ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {
                {
                  all: "Tümü",
                  pending: "Beklemede",
                  approved: "Onaylı",
                  rejected: "Reddedildi",
                }[s]
              }
              <span className="ml-1 opacity-70">({statusCounts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {total} sonuç bulundu
        {loading && (
          <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin text-gray-400" />
        )}
      </p>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Sonuç bulunamadı.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-800">
                      {app.teacherName} {app.teacherSurname}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm mb-4">
                  <InfoRow icon={Mail} label="E-posta" value={app.teacherEmail} />
                  <InfoRow icon={Phone} label="Telefon" value={app.teacherPhoneNumber} />
                  <InfoRow icon={BookOpen} label="Alan" value={app.field} />
                  {app.education && (
                    <InfoRow icon={GraduationCap} label="Eğitim" value={app.education} />
                  )}
                  {app.experienceYears && (
                    <InfoRow icon={Briefcase} label="Deneyim" value={app.experienceYears} />
                  )}
                  {app.targetLevels && (
                    <InfoRow icon={BookOpen} label="Hedef Seviye" value={app.targetLevels} />
                  )}
                  {app.availableHours && (
                    <InfoRow icon={Calendar} label="Müsaitlik" value={app.availableHours} />
                  )}
                  {app.lessonMode && (
                    <InfoRow
                      icon={Monitor}
                      label="Ders Şekli"
                      value={formatLessonMode(app.lessonMode)}
                    />
                  )}
                  {app.hourlyRateOnline != null && (
                    <InfoRow
                      icon={Wallet}
                      label="Online Ücret"
                      value={`${app.hourlyRateOnline} ₺/saat`}
                    />
                  )}
                  {app.hourlyRateInPerson != null && (
                    <InfoRow
                      icon={Wallet}
                      label="Yüz Yüze Ücret"
                      value={`${app.hourlyRateInPerson} ₺/saat`}
                    />
                  )}
                  {!app.hourlyRateOnline &&
                    !app.hourlyRateInPerson &&
                    app.hourlyRate && (
                      <InfoRow icon={Wallet} label="Ücret" value={app.hourlyRate} />
                    )}
                  {(app.city || app.district) && (
                    <InfoRow
                      icon={Monitor}
                      label="Konum"
                      value={[app.city, app.district].filter(Boolean).join(" / ")}
                    />
                  )}
                </div>

                {app.bio && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">{app.bio}</p>
                  </div>
                )}

                {app.status === "pending" && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <Button
                      onClick={() =>
                        setFieldSelector({
                          isOpen: true,
                          applicationId: app.id,
                          teacherName: `${app.teacherName} ${app.teacherSurname}`,
                        })
                      }
                      disabled={updating === app.id}
                      variant="secondary"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-1.5" /> Alan Seç & Onayla
                    </Button>
                    <Button
                      onClick={() => updateStatus(app.id, "approved")}
                      disabled={updating === app.id}
                      variant="primaryOutline"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1.5" /> Hızlı Onayla
                    </Button>
                    <Button
                      onClick={() => updateStatus(app.id, "rejected")}
                      disabled={updating === app.id}
                      variant="danger"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1.5" /> Reddet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Sayfa {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <FieldSelector
        isOpen={fieldSelector.isOpen}
        onClose={() =>
          setFieldSelector({ isOpen: false, applicationId: null, teacherName: "" })
        }
        applicationId={fieldSelector.applicationId || 0}
        teacherName={fieldSelector.teacherName}
        onFieldsChange={() => {}}
      />
    </div>
  );
}

function formatLessonMode(mode: string): string {
  switch (mode) {
    case "online":
      return "Online";
    case "in_person":
      return "Yüz yüze";
    case "both":
      return "Online & yüz yüze";
    default:
      return mode;
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      <span className="text-gray-400 text-xs">{label}:</span>
      <span className="truncate">{value}</span>
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
    <Badge className={styles[status] || styles.pending}>
      {labels[status] || status}
    </Badge>
  );
}
