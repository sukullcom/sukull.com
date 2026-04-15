"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User,
  BookOpen,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Timer,
  Calendar,
  Monitor,
  Wallet,
  MessageSquare,
} from "lucide-react";

type StudentApplication = {
  id: number;
  studentName: string;
  studentSurname: string;
  studentEmail: string;
  studentPhoneNumber: string;
  subject: string;
  studentLevel: string | null;
  lessonDuration: string | null;
  availableHours: string | null;
  budget: string | null;
  lessonMode: string | null;
  studentNeeds: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 20;

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [filtered, setFiltered] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  useEffect(() => { fetchApplications(); }, []);

  const applyFilters = useCallback((apps: StudentApplication[], query: string, status: StatusFilter) => {
    let result = apps;
    if (status !== "all") result = result.filter(a => a.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        `${a.studentName} ${a.studentSurname}`.toLowerCase().includes(q) ||
        a.studentEmail.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q)
      );
    }
    return result;
  }, []);

  useEffect(() => {
    setFiltered(applyFilters(applications, searchQuery, statusFilter));
    setPage(0);
  }, [applications, searchQuery, statusFilter, applyFilters]);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/admin/student-applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        toast.error("Başvurular yüklenirken hata oluştu");
      }
    } catch {
      toast.error("Başvurular yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const action = status === "approved" ? "approve" : "reject";
      const response = await fetch(`/api/admin/student-applications/${id}`, {
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <span className="text-sm text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-800">Öğrenci Başvuruları</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Öğrenci Başvuruları</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="İsim, e-posta veya alan ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {{ all: "Tümü", pending: "Beklemede", approved: "Onaylı", rejected: "Reddedildi" }[s]}
              <span className="ml-1 opacity-70">({statusCounts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} sonuç bulundu</p>

      {pageData.length === 0 ? (
        <Card><CardContent className="py-8"><p className="text-center text-gray-500">Sonuç bulunamadı.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pageData.map(app => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-800">{app.studentName} {app.studentSurname}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm mb-4">
                  <InfoRow icon={Mail} label="E-posta" value={app.studentEmail} />
                  <InfoRow icon={Phone} label="Telefon" value={app.studentPhoneNumber} />
                  <InfoRow icon={BookOpen} label="Ders Alanı" value={app.subject} />
                  {app.studentLevel && <InfoRow icon={GraduationCap} label="Seviye" value={app.studentLevel} />}
                  {app.lessonDuration && <InfoRow icon={Timer} label="Ders Süresi" value={`${app.lessonDuration} dk`} />}
                  {app.availableHours && <InfoRow icon={Calendar} label="Müsaitlik" value={app.availableHours} />}
                  {app.budget && <InfoRow icon={Wallet} label="Bütçe" value={app.budget} />}
                  {app.lessonMode && <InfoRow icon={Monitor} label="Ders Şekli" value={app.lessonMode} />}
                </div>

                {app.studentNeeds && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">{app.studentNeeds}</p>
                  </div>
                )}

                {app.status === "pending" && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button onClick={() => updateStatus(app.id, "approved")} disabled={updating === app.id} variant="secondary" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1.5" /> Onayla
                    </Button>
                    <Button onClick={() => updateStatus(app.id, "rejected")} disabled={updating === app.id} variant="danger" size="sm">
                      <XCircle className="h-4 w-4 mr-1.5" /> Reddet
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
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">Sayfa {page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
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
