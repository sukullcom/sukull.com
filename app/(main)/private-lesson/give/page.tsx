"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { FeedWrapper } from "@/components/feed-wrapper";
import Image from "next/image";
import {
  TeachingCapabilityRowsField,
  type CapabilityRow,
} from "@/components/private-lesson/teaching-capability-rows-field";
import { TeacherAvailableHoursField } from "@/components/private-lesson/teacher-available-hours-field";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/ui/searchable-combobox";
import {
  ArrowRight,
  BookOpen,
  User,
  Phone,
  Mail,
  Info,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Briefcase,
  Monitor,
  Wallet,
  FileText,
  Building2,
  BookMarked,
} from "lucide-react";

type ApplicationStatus = {
  hasApplication: boolean;
  status?: string;
  field?: string;
  createdAt?: string;
};

export default function GiveLessonPage() {
  const [formData, setFormData] = useState({
    teacherName: "",
    teacherSurname: "",
    teacherPhoneNumber: "",
    teacherEmail: "",
    education: "",
    university: "",
    universityDepartment: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<ComboboxOption[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/schools?action=universities", {
          cache: "force-cache",
        });
        if (!res.ok) throw new Error("Üniversite listesi alınamadı");
        const data = (await res.json()) as {
          universities: Array<{ name: string; city: string | null }>;
        };
        if (!active) return;
        setUniversities(
          (data.universities ?? []).map((u) => ({
            value: u.name,
            label: u.name,
            hint: u.city ?? undefined,
          })),
        );
      } catch {
        // Sessizce başarısız ol — kullanıcı kendi yazabilsin diye allowFreeText açık.
      } finally {
        if (active) setUniversitiesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const res = await fetch("/api/private-lesson/give");
        if (res.ok) {
          const data = await res.json();
          setAppStatus(data);
        }
      } catch {
        // silently fail, show form as fallback
      } finally {
        setLoading(false);
      }
    };
    checkApplicationStatus();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const caps = capabilityRows.filter((r) => r.subject && r.grade);
    if (caps.length === 0) {
      return toast.error("En az bir ders ve sınıf çifti seçmelisin.");
    }

    setIsSubmitting(true);

    const body = {
      ...formData,
      field: caps[0].subject,
      capabilities: caps,
      quizResult: 0,
      passed: true,
    };

    try {
      const res = await fetch("/api/private-lesson/give", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
        return;
      }
      
      router.push("/private-lesson/give/success");
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = () => {
    const hasCaps = capabilityRows.some((r) => r.subject && r.grade);
    const requiredFields = [
      hasCaps ? "ok" : "",
      formData.teacherName,
      formData.teacherSurname,
      formData.teacherPhoneNumber,
      formData.teacherEmail,
    ];
    const optionalFields = [
      formData.education,
      formData.university,
      formData.universityDepartment,
      formData.experienceYears,
      formData.targetLevels,
      formData.availableHours,
      formData.lessonMode,
      formData.hourlyRateOnline,
      formData.hourlyRateInPerson,
      formData.city,
      formData.district,
      formData.bio,
    ];
    const requiredCompleted = requiredFields.filter((f) => f !== "").length;
    const optionalCompleted = optionalFields.filter((f) => f !== "").length;
    return Math.round(
      ((requiredCompleted + optionalCompleted * 0.5) /
        (requiredFields.length + optionalFields.length * 0.5)) *
        100,
    );
  };

  if (loading) {
    return (
      <div className="flex-1 mx-auto w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-suk-brand" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (appStatus?.hasApplication && appStatus.status === "pending") {
    return (
      <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
        <FeedWrapper>
          <Card className="border-suk-warning-border bg-suk-warning-soft shadow-lg">
            <CardContent className="p-5 text-center sm:p-8">
              <Clock className="mx-auto mb-4 h-12 w-12 text-suk-warning sm:h-16 sm:w-16" />
              <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">Başvurun inceleniyor</h2>
              <p className="mb-4 text-muted-foreground">
                <strong>{appStatus.field}</strong> alanındaki eğitmen başvurun ekibimiz
                tarafından değerlendiriliyor. Uygunluk teyidinden sonra sana dönüş
                yapılacak; bu süreçte öğrenci akışını kullanmaya devam edebilirsin.
              </p>
              <div className="inline-block rounded-lg border border-suk-warning-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Başvuru tarihi: {appStatus.createdAt ? new Date(appStatus.createdAt).toLocaleDateString('tr-TR') : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </FeedWrapper>
      </div>
    );
  }

  if (appStatus?.hasApplication && appStatus.status === "approved") {
    return (
      <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
        <FeedWrapper>
          <Card className="border-suk-brand/35 bg-suk-brand-soft shadow-lg">
            <CardContent className="p-5 text-center sm:p-8">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-suk-brand sm:h-16 sm:w-16" />
              <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">Eğitmen başvurun onaylandı</h2>
              <p className="mb-4 text-muted-foreground">
                Tebrikler. Artık eğitmen rehberinde öğrenciler tarafından
                görülebilirsin; açık talep ilanlarına teklif de verebilirsin. Profilini
                güncel tutmak daha fazla eşleşme sağlar.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="secondary" asChild>
                  <Link href="/private-lesson/teacher-dashboard/settings">
                    Profilini güncelle
                  </Link>
                </Button>
                <Button variant="primary" asChild>
                  <Link href="/private-lesson/teacher-dashboard">
                    Eğitmen paneline git
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </FeedWrapper>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {appStatus?.hasApplication && appStatus.status === "rejected" && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Önceki başvurun reddedildi</h3>
                  <p className="mt-1 text-sm text-destructive/90">
                    Bilgilerini güncelleyerek tekrar başvurabilirsin.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Section */}
        <div className="mb-6">
          <Card className="border-suk-brand/35 bg-gradient-to-br from-suk-brand-soft to-suk-brand-soft/70 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                    Eğitmen başvurusu
                  </h1>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Bilgi ve deneyimini paylaş; onay sonrası rehberde görünürsün.
                    Kurumda veya birebir zaten ders veriyor olsan da platformda
                    listelenmek için bu başvuruyu tamamlaman gerekir.
                  </p>
                </div>
                <Image
                  src="/heads/hopeful_orange.svg"
                  alt="mascot"
                  width={100}
                  height={100}
                  className="hidden md:block"
                />
              </div>
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Form Tamamlanma</span>
                  <span className="text-sm font-semibold text-suk-brand">{completionPercentage()}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div 
                    className="h-2 rounded-full bg-suk-brand transition-all duration-300"
                    style={{ width: `${completionPercentage()}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-suk-brand" />
              Başvuru Formu
            </CardTitle>
            <CardDescription>
              Tüm alanları eksiksiz doldur. Başvurun Sukull ekibi tarafından
              incelenir; onaylandıktan sonra eğitmen rehberinde ve teklif akışında
              yer alırsın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="space-y-2">
                <TeachingCapabilityRowsField
                  value={capabilityRows}
                  onChange={setCapabilityRows}
                />
              </div>

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adın <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="teacherName"
                    name="teacherName"
                    type="text"
                    placeholder="Örn: Ahmet"
                    value={formData.teacherName}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherSurname" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Soyadın <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="teacherSurname"
                    name="teacherSurname"
                    type="text"
                    placeholder="Örn: Yılmaz"
                    value={formData.teacherSurname}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherPhoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefon Numarası <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="teacherPhoneNumber"
                    name="teacherPhoneNumber"
                    type="tel"
                    placeholder="05xx xxx xx xx"
                    value={formData.teacherPhoneNumber}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta Adresi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="teacherEmail"
                    name="teacherEmail"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={formData.teacherEmail}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Education & Experience */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Eğitim Durumu
                  </Label>
                  <Select value={formData.education} onValueChange={(value) => handleSelectChange("education", value)}>
                    <SelectValue placeholder="Eğitim durumunu seç" />
                    <SelectItem value="Lise">Lise</SelectItem>
                    <SelectItem value="Üniversite öğrencisi">Üniversite öğrencisi</SelectItem>
                    <SelectItem value="Lisans mezunu">Lisans mezunu</SelectItem>
                    <SelectItem value="Yüksek lisans">Yüksek lisans</SelectItem>
                    <SelectItem value="Doktora">Doktora</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Eğitmenlik deneyimi
                  </Label>
                  <Select value={formData.experienceYears} onValueChange={(value) => handleSelectChange("experienceYears", value)}>
                    <SelectValue placeholder="Deneyim süresi seç" />
                    <SelectItem value="0-1 yıl">0-1 yıl</SelectItem>
                    <SelectItem value="1-3 yıl">1-3 yıl</SelectItem>
                    <SelectItem value="3-5 yıl">3-5 yıl</SelectItem>
                    <SelectItem value="5-10 yıl">5-10 yıl</SelectItem>
                    <SelectItem value="10+ yıl">10+ yıl</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Üniversite & Bölüm */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Mezun Olduğun Üniversite
                  </Label>
                  <SearchableCombobox
                    id="university"
                    options={universities}
                    value={formData.university || null}
                    onChange={(v) =>
                      handleSelectChange("university", v ?? "")
                    }
                    isLoading={universitiesLoading}
                    placeholder="Üniversiteni listeden seç"
                    emptyText="Eşleşen üniversite bulunamadı"
                    leftIcon={<Building2 className="w-4 h-4" />}
                    allowFreeText
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Yurt dışı veya listede olmayan kurumlar için kendi yazımını da kullanabilirsin.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="universityDepartment"
                    className="flex items-center gap-2"
                  >
                    <BookMarked className="w-4 h-4" />
                    Bölüm
                  </Label>
                  <Input
                    id="universityDepartment"
                    name="universityDepartment"
                    placeholder="Örn. Matematik Öğretmenliği"
                    value={formData.universityDepartment}
                    onChange={handleChange}
                    maxLength={120}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLevels" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Ders Vereceğin Seviye
                </Label>
                <Select value={formData.targetLevels} onValueChange={(value) => handleSelectChange("targetLevels", value)}>
                  <SelectValue placeholder="Hedef seviye seç" />
                  <SelectItem value="İlkokul (1-4)">İlkokul (1-4)</SelectItem>
                  <SelectItem value="Ortaokul (5-8)">Ortaokul (5-8)</SelectItem>
                  <SelectItem value="Lise (9-12)">Lise (9-12)</SelectItem>
                  <SelectItem value="Üniversite Hazırlık">Üniversite Hazırlık</SelectItem>
                  <SelectItem value="Üniversite">Üniversite</SelectItem>
                  <SelectItem value="Tüm seviyeler">Tüm seviyeler</SelectItem>
                </Select>
              </div>

              <TeacherAvailableHoursField
                value={formData.availableHours}
                onChange={(value) => handleSelectChange("availableHours", value)}
              />

              {/* Lesson Mode */}
              <div className="space-y-2">
                <Label htmlFor="lessonMode" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Ders Şekli
                </Label>
                <Select
                  value={formData.lessonMode}
                  onValueChange={(value) => handleSelectChange("lessonMode", value)}
                >
                  <SelectValue placeholder="Ders şekli seç" />
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">Yüz yüze</SelectItem>
                  <SelectItem value="both">Online & yüz yüze</SelectItem>
                </Select>
              </div>

              {/* Hourly Rates (split) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRateOnline" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Online Saatlik Ücret (₺)
                  </Label>
                  <Input
                    id="hourlyRateOnline"
                    name="hourlyRateOnline"
                    type="number"
                    min={0}
                    max={100000}
                    step={10}
                    placeholder="Örn. 300"
                    value={formData.hourlyRateOnline}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRateInPerson" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Yüz Yüze Saatlik Ücret (₺)
                  </Label>
                  <Input
                    id="hourlyRateInPerson"
                    name="hourlyRateInPerson"
                    type="number"
                    min={0}
                    max={100000}
                    step={10}
                    placeholder="Örn. 450"
                    value={formData.hourlyRateInPerson}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Location (for in-person / both) */}
              {(formData.lessonMode === "in_person" ||
                formData.lessonMode === "both") && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Şehir</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Örn. İstanbul"
                      value={formData.city}
                      onChange={handleChange}
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe / Semt</Label>
                    <Input
                      id="district"
                      name="district"
                      type="text"
                      placeholder="Örn. Kadıköy"
                      value={formData.district}
                      onChange={handleChange}
                      maxLength={60}
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Kısa Tanıtım
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Kendini kısaca tanıt: çalışma tarzın, uzmanlıkların ve öğrencilere nasıl destek olabileceğin."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="resize-none transition-all duration-200 focus:scale-[1.01]"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/500 karakter
                </p>
              </div>

              {/* Info Alert */}
              <div className="rounded-lg border border-suk-brand/25 bg-suk-brand-soft p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-suk-brand" />
                  <div className="text-sm text-suk-brand-soft-fg">
                    <p className="font-semibold mb-1">Önemli bilgilendirme</p>
                    <p>
                      Başvurun ve profil bilgilerin uygunluk kontrolünden geçer;
                      yanıltıcı veya eksik bilgi onayın gecikmesine veya reddine yol
                      açabilir. Onay sonrası öğrenciler seni rehberde görebilir; bilgilerini
                      sonra da güncelleyebilirsin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                variant="primary"
                type="submit" 
                size="lg" 
                className="w-full transition-all duration-200 hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    Başvuruyu Gönder
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FeedWrapper>
    </div>
  );
}
