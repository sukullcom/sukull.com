"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, RefreshCcw } from "lucide-react";

type AffectedUser = {
  userId: string;
  email: string | null;
  name: string | null;
  currentRole: string | null;
};

type ApplyResult = {
  success: boolean;
  message: string;
  updatedCount?: number;
  updatedUsers?: string[];
  error?: string;
};

export default function FixStudentRolesPage() {
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [affected, setAffected] = useState<AffectedUser[]>([]);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const response = await fetch("/api/admin/fix-student-roles", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setPreviewError(data.error || "Önizleme alınamadı.");
        setAffected([]);
        return;
      }

      setAffected(data.affectedUsers ?? []);
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.",
      );
      setAffected([]);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleApply = async () => {
    if (affected.length === 0) return;
    const confirmed = window.confirm(
      `${affected.length} kullanıcının rolü "student" olarak güncellenecek. Devam edilsin mi?`,
    );
    if (!confirmed) return;

    setApplying(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/fix-student-roles", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: "Güncelleme başarısız oldu.",
          error: data.error || "Bilinmeyen bir hata oluştu.",
        });
        return;
      }

      setResult({
        success: true,
        message: data.message,
        updatedCount: data.updatedCount,
        updatedUsers: data.updatedUsers,
      });
      setAffected([]);
    } catch (error) {
      setResult({
        success: false,
        message: "Güncelleme başarısız oldu.",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">Öğrenci Rolü Onarımı</CardTitle>
              <CardDescription>
                Öğrenci başvurusu onaylanmış olduğu hâlde <code>users.role</code>
                {" "}değeri eksik ya da farklı olan kullanıcıları tespit eder ve
                rollerini <b>student</b> olarak günceller. Öğretmen ve yönetici
                rolleri korunur.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPreview}
              disabled={previewLoading || applying}
              title="Önizlemeyi yenile"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800 text-sm">
                <strong>Not:</strong> Onay akışı artık rolü otomatik olarak
                senkronize ediyor. Bu araç yalnızca tarihsel tutarsızlıklar
                (manuel DB düzenlemesi, eski kayıtlar, nadir yarış koşulları)
                için gereklidir.
              </p>
            </div>

            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Etkilenecek kullanıcılar taranıyor...
              </div>
            )}

            {previewError && !previewLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Önizleme alınamadı</AlertTitle>
                <AlertDescription>{previewError}</AlertDescription>
              </Alert>
            )}

            {!previewLoading && !previewError && affected.length === 0 && !result && (
              <Alert>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle>Tüm roller tutarlı</AlertTitle>
                <AlertDescription>
                  Güncellenmesi gereken bir kullanıcı yok.
                </AlertDescription>
              </Alert>
            )}

            {!previewLoading && !previewError && affected.length > 0 && (
              <div className="rounded-md border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">
                    <b>{affected.length}</b> kullanıcı güncellenecek
                  </p>
                </div>
                <ul className="divide-y text-sm max-h-96 overflow-y-auto">
                  {affected.map((user) => (
                    <li key={user.userId} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {user.name || user.email || user.userId}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email ?? "e-posta yok"} · ID: {user.userId}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                        mevcut: {user.currentRole ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <AlertTitle>{result.message}</AlertTitle>
                <AlertDescription>
                  {result.success ? (
                    result.updatedUsers && result.updatedUsers.length > 0 ? (
                      <p className="mt-1 text-sm">
                        Güncellenen kullanıcı sayısı: <b>{result.updatedCount}</b>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm">Hiçbir kullanıcı güncellenmedi.</p>
                    )
                  ) : (
                    <p className="mt-1 text-sm text-red-600">{result.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleApply}
            disabled={applying || previewLoading || affected.length === 0}
            className="w-full"
          >
            {applying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Güncelleniyor...
              </>
            ) : affected.length === 0 ? (
              "Güncellenecek kullanıcı yok"
            ) : (
              `${affected.length} kullanıcıyı güncelle`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
