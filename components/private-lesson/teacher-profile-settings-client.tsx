"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import {
  TeachingCapabilityRowsField,
  type CapabilityRow,
} from "@/components/private-lesson/teaching-capability-rows-field";
import { TeacherAvailableHoursField } from "@/components/private-lesson/teacher-available-hours-field";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import {
  BookOpen,
  User,
  Phone,
  Mail,
  Info,
  GraduationCap,
  Loader2,
  Briefcase,
  Monitor,
  Wallet,
  FileText,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { CSRF_HEADER_NAME } from "@/lib/csrf-constants";

type ApiApplication = {
  teacherName: string;
  teacherSurname: string;
  teacherPhoneNumber: string;
  teacherEmail: string;
  field: string;
  capabilities: CapabilityRow[];
  education: string;
  experienceYears: string;
  targetLevels: string;
  availableHours: string;
  lessonMode: string;
  hourlyRateOnline: string;
  hourlyRateInPerson: string;
  city: string;
  district: string;
  bio: string;
};

function capsToRows(caps: CapabilityRow[]): CapabilityRow[] {
  if (caps.length > 0) return caps.map((c) => ({ subject: c.subject, grade: c.grade }));
  return [{ subject: "", grade: "" }];
}

export function TeacherProfileSettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [formData, setFormData] = useState({
    teacherName: "",
    teacherSurname: "",
    teacherPhoneNumber: "",
    teacherEmail: "",
    education: "",
    experienceYears: "",
    targetLevels: "",
    availableHours: "",
    lessonMode: "",
    hourlyRateOnline: "",
    hourlyRateInPerson: "",
    city: "",
    district: "",
    bio: "",
  });
  const [capabilityRows, setCapabilityRows] = useState<CapabilityRow[]>([
    { subject: "", grade: "" },
  ]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const mintCsrf = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/csrf", { method: "GET", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        csrfToken?: string;
        error?: string;
      };
      if (!res.ok || !data.csrfToken) {
        if (data.error) toast.error(data.error);
        return null;
      }
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (err) {
      clientLogger.error({
        message: "csrf mint failed",
        error: err,
        location: "TeacherProfileSettingsClient/mintCsrf",
      });
      return null;
    }
  }, []);

  const resolveCsrf = useCallback(async (): Promise<string | null> => {
    if (csrfToken) return csrfToken;
    return mintCsrf();
  }, [csrfToken, mintCsrf]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/private-lesson/teacher-profile");
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        application?: ApiApplication;
      };
      if (!res.ok) {
        toast.error(data.error || "Profil yüklenemedi");
        router.push("/private-lesson/teacher-dashboard");
        return;
      }
      const app = data.application;
      if (!app) {
        router.push("/private-lesson/teacher-dashboard");
        return;
      }
      setFormData({
        teacherName: app.teacherName,
        teacherSurname: app.teacherSurname,
        teacherPhoneNumber: app.teacherPhoneNumber,
        teacherEmail: app.teacherEmail,
        education: app.education,
        experienceYears: app.experienceYears,
        targetLevels: app.targetLevels,
        availableHours: app.availableHours,
        lessonMode: app.lessonMode,
        hourlyRateOnline: app.hourlyRateOnline,
        hourlyRateInPerson: app.hourlyRateInPerson,
        city: app.city,
        district: app.district,
        bio: app.bio,
      });
      setCapabilityRows(capsToRows(app.capabilities ?? []));
    } catch (e) {
      clientLogger.error({
        message: "teacher profile load failed",
        error: e,
        location: "TeacherProfileSettingsClient/load",
      });
      toast.error("Profil yüklenemedi");
      router.push("/private-lesson/teacher-dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.all([mintCsrf(), load()]);
  }, [load, mintCsrf]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const caps = capabilityRows.filter((r) => r.subject && r.grade);
    if (caps.length === 0) {
      toast.error("En az bir ders ve sınıf çifti seçmelisin.");
      return;
    }
    setSaving(true);
    try {
      const token = await resolveCsrf();
      if (!token) {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        return;
      }
      const res = await fetch("/api/private-lesson/teacher-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: token,
        },
        body: JSON.stringify({
          ...formData,
          field: caps[0].subject,
          capabilities: caps,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Kaydedilemedi");
        return;
      }
      toast.success(data.message || "Profilin güncellendi.");
      router.refresh();
    } catch (err) {
      clientLogger.error({
        message: "teacher profile save failed",
        error: err,
        location: "TeacherProfileSettingsClient/handleSubmit",
      });
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const token = await resolveCsrf();
      if (!token) {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        return;
      }
      const res = await fetch("/api/private-lesson/teacher-profile/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: token,
        },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "İşlem başarısız");
        return;
      }
      toast.success(data.message || "Öğretmenlikten ayrıldın.");
      window.location.href = "/private-lesson";
    } catch (err) {
      clientLogger.error({
        message: "teacher leave failed",
        error: err,
        location: "TeacherProfileSettingsClient/handleLeave",
      });
      toast.error("İşlem başarısız");
    } finally {
      setLeaving(false);
      setLeaveOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-suk-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href="/private-lesson/teacher-dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Panele dön
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Eğitmen profili
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rehberde ve teklif eşleştirmesinde kullanılan bilgileri güncelle. Ders
          alanlarını değiştirirsen ilan listesi otomatik yeni branşlarına göre
          filtrelenir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-suk-brand" />
            Profil bilgileri
          </CardTitle>
          <CardDescription>
            Kaydettiğinde hem başvuru kaydın hem ders branşların güncellenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <TeachingCapabilityRowsField
              value={capabilityRows}
              onChange={setCapabilityRows}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Ad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teacherName"
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherSurname" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Soyad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teacherSurname"
                  name="teacherSurname"
                  value={formData.teacherSurname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherPhoneNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teacherPhoneNumber"
                  name="teacherPhoneNumber"
                  type="tel"
                  value={formData.teacherPhoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-posta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teacherEmail"
                  name="teacherEmail"
                  type="email"
                  value={formData.teacherEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Eğitim
                </Label>
                <Select
                  value={formData.education}
                  onValueChange={(v) => handleSelectChange("education", v)}
                >
                  <SelectValue placeholder="Seç" />
                  <SelectItem value="Lise">Lise</SelectItem>
                  <SelectItem value="Üniversite öğrencisi">Üniversite öğrencisi</SelectItem>
                  <SelectItem value="Lisans mezunu">Lisans mezunu</SelectItem>
                  <SelectItem value="Yüksek lisans">Yüksek lisans</SelectItem>
                  <SelectItem value="Doktora">Doktora</SelectItem>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Deneyim
                </Label>
                <Select
                  value={formData.experienceYears}
                  onValueChange={(v) => handleSelectChange("experienceYears", v)}
                >
                  <SelectValue placeholder="Seç" />
                  <SelectItem value="0-1 yıl">0-1 yıl</SelectItem>
                  <SelectItem value="1-3 yıl">1-3 yıl</SelectItem>
                  <SelectItem value="3-5 yıl">3-5 yıl</SelectItem>
                  <SelectItem value="5-10 yıl">5-10 yıl</SelectItem>
                  <SelectItem value="10+ yıl">10+ yıl</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Hedef seviye
                </Label>
                <Select
                  value={formData.targetLevels}
                  onValueChange={(v) => handleSelectChange("targetLevels", v)}
                >
                  <SelectValue placeholder="Seç" />
                  <SelectItem value="İlkokul (1-4)">İlkokul (1-4)</SelectItem>
                  <SelectItem value="Ortaokul (5-8)">Ortaokul (5-8)</SelectItem>
                  <SelectItem value="Lise (9-12)">Lise (9-12)</SelectItem>
                  <SelectItem value="Üniversite Hazırlık">Üniversite Hazırlık</SelectItem>
                  <SelectItem value="Üniversite">Üniversite</SelectItem>
                  <SelectItem value="Tüm seviyeler">Tüm seviyeler</SelectItem>
                </Select>
              </div>
            </div>

            <TeacherAvailableHoursField
              value={formData.availableHours}
              onChange={(v) => handleSelectChange("availableHours", v)}
            />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Ders şekli
              </Label>
              <Select
                value={formData.lessonMode}
                onValueChange={(v) => handleSelectChange("lessonMode", v)}
              >
                <SelectValue placeholder="Seç" />
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in_person">Yüz yüze</SelectItem>
                <SelectItem value="both">Online & yüz yüze</SelectItem>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Online ücret (₺)
                </Label>
                <Input
                  name="hourlyRateOnline"
                  type="number"
                  min={0}
                  max={100000}
                  step={10}
                  value={formData.hourlyRateOnline}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Yüz yüze ücret (₺)
                </Label>
                <Input
                  name="hourlyRateInPerson"
                  type="number"
                  min={0}
                  max={100000}
                  step={10}
                  value={formData.hourlyRateInPerson}
                  onChange={handleChange}
                />
              </div>
            </div>

            {(formData.lessonMode === "in_person" || formData.lessonMode === "both") && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleChange} maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    maxLength={60}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tanıtım
              </Label>
              <Textarea
                id="bio"
                name="bio"
                rows={4}
                maxLength={1000}
                value={formData.bio}
                onChange={handleChange}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{formData.bio.length}/1000</p>
            </div>

            <div className="flex gap-2 rounded-lg border border-suk-payment-ring/40 bg-suk-payment-soft p-3 text-sm text-suk-payment-soft-fg">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Yanıltıcı veya eksik bilgi hesabının incelenmesine yol açabilir. Bu
                form yalnızca onaylı eğitmenler içindir.
              </p>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Kaydediliyor…
                </>
              ) : (
                "Değişiklikleri kaydet"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/25 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Öğretmenlikten ayrıl
          </CardTitle>
          <CardDescription className="text-destructive/90">
            Bekleyen tüm ilan tekliflerin geri çekilir; eğitmen başvuru kaydın ve
            branş kayıtların silinir. Rolün &quot;öğrenci / kullanıcı&quot; olur; tekrar
            eğitmen olmak için yeniden başvurman gerekir. Kabul edilmiş teklif
            geçmişin sistemde kalabilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="danger" onClick={() => setLeaveOpen(true)}>
            Öğretmenlikten ayrıl
          </Button>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={leaveOpen}
        onOpenChange={(o: boolean) => !o && !leaving && setLeaveOpen(false)}
        title="Öğretmenlikten ayrılmak istediğine emin misin?"
        description="Bu işlem geri alınamaz. Eğitmen verilerin silinir; bekleyen tekliflerin geri çekilir."
        confirmLabel="Evet, ayrıl"
        cancelLabel="Vazgeç"
        confirmVariant="danger"
        onConfirm={handleLeave}
        pending={leaving}
        imageSrc="/mascot_sad.svg"
      />
    </div>
  );
}
