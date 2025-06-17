"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Mail, Phone, User, BookOpen, DollarSign } from "lucide-react";

type TeacherApplication = {
  id: number;
  teacherName: string;
  teacherSurname: string;
  teacherEmail: string;
  teacherPhoneNumber: string;
  field: string;
  quizResult: number;
  passed: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function TeacherApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/admin/teacher-applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        toast.error("Başvurular yüklenirken hata oluştu");
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Başvurular yüklenirken hata oluştu");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: number, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const action = status === "approved" ? "approve" : "reject";
      const response = await fetch(`/api/admin/teacher-applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(`Başvuru ${status === "approved" ? "onaylandı" : "reddedildi"}`);
        fetchApplications();
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        toast.error(`İşlem başarısız: ${errorData.message || "Bilinmeyen hata"}`);
      }
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("İşlem başarısız: Bağlantı hatası");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Onaylandı</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Reddedildi</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Öğretmen Başvuruları</h1>
        <Button onClick={fetchApplications} variant="outline">
          Yenile
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Henüz başvuru bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(applications) ? applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {application.teacherName} {application.teacherSurname}
                  </CardTitle>
                  {getStatusBadge(application.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{application.teacherEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{application.teacherPhoneNumber}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{application.field}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-gray-600">
                    Quiz Sonucu: <strong>{application.quizResult}</strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Durum: <strong>{application.passed ? "Geçti" : "Kaldı"}</strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Tarih: <strong>{new Date(application.createdAt).toLocaleDateString("tr-TR")}</strong>
                  </span>
                </div>

                {application.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => updateApplicationStatus(application.id, "approved")}
                      disabled={updating === application.id}
                      variant="secondary"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Onayla
                    </Button>
                    <Button
                      onClick={() => updateApplicationStatus(application.id, "rejected")}
                      disabled={updating === application.id}
                      variant="danger"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Veri yüklenirken bir hata oluştu.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 