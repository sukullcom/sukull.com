"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Wallet,
  FileText
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
    field: "",
    education: "",
    experienceYears: "",
    targetLevels: "",
    availableHours: "",
    lessonMode: "",
    hourlyRate: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

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
    
    if (!formData.field) {
      return toast.error("Lütfen bir alan seç.");
    }
    
    setIsSubmitting(true);
    
    const body = {
      ...formData,
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
    const requiredFields = [
      formData.field,
      formData.teacherName,
      formData.teacherSurname,
      formData.teacherPhoneNumber,
      formData.teacherEmail,
    ];
    const optionalFields = [
      formData.education,
      formData.experienceYears,
      formData.targetLevels,
      formData.availableHours,
      formData.lessonMode,
      formData.hourlyRate,
      formData.bio,
    ];
    const requiredCompleted = requiredFields.filter(f => f !== "").length;
    const optionalCompleted = optionalFields.filter(f => f !== "").length;
    return Math.round(((requiredCompleted + optionalCompleted * 0.5) / (requiredFields.length + optionalFields.length * 0.5)) * 100);
  };

  if (loading) {
    return (
      <div className="flex-1 mx-auto w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (appStatus?.hasApplication && appStatus.status === "pending") {
    return (
      <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
        <FeedWrapper>
          <Card className="shadow-lg border-yellow-200 bg-yellow-50">
            <CardContent className="p-5 sm:p-8 text-center">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Başvurun değerlendiriliyor</h2>
              <p className="text-gray-600 mb-4">
                <strong>{appStatus.field}</strong> alanındaki eğitmen başvurun inceleniyor.
                En kısa sürede sana dönüş yapılacak.
              </p>
              <div className="bg-white rounded-lg p-4 border border-yellow-200 inline-block">
                <p className="text-sm text-gray-500">Başvuru tarihi: {appStatus.createdAt ? new Date(appStatus.createdAt).toLocaleDateString('tr-TR') : '-'}</p>
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
          <Card className="shadow-lg border-green-200 bg-green-50">
            <CardContent className="p-5 sm:p-8 text-center">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Eğitmen başvurun onaylandı!</h2>
              <p className="text-gray-600 mb-6">
                Tebrikler! Artık öğrenciler tarafından görülebilir durumdasın.
                Profilini güncelleyerek daha fazla öğrenciye ulaşabilirsin.
              </p>
              <Button variant="primary" onClick={() => router.push("/private-lesson")}>
                Özel Ders Paneline Git
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
          <Card className="mb-6 shadow-lg border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Önceki başvurun reddedildi</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Bilgilerini güncelleyerek tekrar başvurabilirsin.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Section */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Öğretmen Başvurusu
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Bilgi ve deneyimini paylaşarak öğrencilere yardımcı ol
                  </p>
                </div>
                <Image
                  src="/mascot_pink.svg"
                  alt="mascot"
                  width={100}
                  height={100}
                  className="hidden md:block"
                />
              </div>
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Form Tamamlanma</span>
                  <span className="text-sm font-semibold text-green-600">{completionPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
              <GraduationCap className="w-6 h-6 text-green-500" />
              Başvuru Formu
            </CardTitle>
            <CardDescription>
              Tüm alanları eksiksiz doldur. Başvurun onaylandıktan sonra öğrenciler tarafından görülebilir olacaksın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Field Selection */}
              <div className="space-y-2">
                <Label htmlFor="field" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Ders Alanı <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.field} onValueChange={(value) => handleSelectChange("field", value)}>
                  <SelectValue placeholder="Hangi alanda ders vermek istiyorsun?" />
                  <SelectItem value="Matematik">Matematik</SelectItem>
                  <SelectItem value="Fizik">Fizik</SelectItem>
                  <SelectItem value="Kimya">Kimya</SelectItem>
                  <SelectItem value="Biyoloji">Biyoloji</SelectItem>
                  <SelectItem value="Tarih">Tarih</SelectItem>
                  <SelectItem value="Coğrafya">Coğrafya</SelectItem>
                  <SelectItem value="Edebiyat">Edebiyat</SelectItem>
                  <SelectItem value="İngilizce">İngilizce</SelectItem>
                  <SelectItem value="Almanca">Almanca</SelectItem>
                  <SelectItem value="Fransızca">Fransızca</SelectItem>
                  <SelectItem value="Felsefe">Felsefe</SelectItem>
                  <SelectItem value="Müzik">Müzik</SelectItem>
                  <SelectItem value="Resim">Resim</SelectItem>
                  <SelectItem value="Bilgisayar Bilimleri">Bilgisayar Bilimleri</SelectItem>
                  <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                </Select>
              </div>

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adın <span className="text-red-500">*</span>
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
                    Soyadın <span className="text-red-500">*</span>
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
                    Telefon Numarası <span className="text-red-500">*</span>
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
                    E-posta Adresi <span className="text-red-500">*</span>
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
                    Öğretmenlik Deneyimi
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

              {/* Target Levels & Availability */}
              <div className="grid md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="availableHours" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Müsait Olduğun Saatler
                  </Label>
                  <Select value={formData.availableHours} onValueChange={(value) => handleSelectChange("availableHours", value)}>
                    <SelectValue placeholder="Saat aralığı seç" />
                    <SelectItem value="Sabah (09:00-12:00)">Sabah (09:00-12:00)</SelectItem>
                    <SelectItem value="Öğleden sonra (12:00-17:00)">Öğleden sonra (12:00-17:00)</SelectItem>
                    <SelectItem value="Akşam (17:00-21:00)">Akşam (17:00-21:00)</SelectItem>
                    <SelectItem value="Hafta sonu">Hafta sonu</SelectItem>
                    <SelectItem value="Esnek">Esnek / Farketmez</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Lesson Mode & Rate */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonMode" className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Ders Şekli
                  </Label>
                  <Select value={formData.lessonMode} onValueChange={(value) => handleSelectChange("lessonMode", value)}>
                    <SelectValue placeholder="Ders şekli seç" />
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Yüz yüze">Yüz yüze</SelectItem>
                    <SelectItem value="Her ikisi de">Her ikisi de</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Ücret Beklentisi (Saat başı)
                  </Label>
                  <Select value={formData.hourlyRate} onValueChange={(value) => handleSelectChange("hourlyRate", value)}>
                    <SelectValue placeholder="Ücret aralığı seç" />
                    <SelectItem value="0-200 TL">0-200 TL</SelectItem>
                    <SelectItem value="200-400 TL">200-400 TL</SelectItem>
                    <SelectItem value="400-600 TL">400-600 TL</SelectItem>
                    <SelectItem value="600+ TL">600+ TL</SelectItem>
                    <SelectItem value="Görüşülür">Görüşülür</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Kısa Tanıtım
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Kendinizi kısaca tanıtın. Öğretmenlik yaklaşımınız, uzmanlık alanlarınız ve öğrencilerinize nasıl yardımcı olabileceğinizi yazın."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="resize-none transition-all duration-200 focus:scale-[1.01]"
                />
                <p className="text-xs text-gray-500">
                  {formData.bio.length}/500 karakter
                </p>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Önemli Bilgilendirme</p>
                    <p>Başvurun onaylandıktan sonra öğrenciler tarafından görülebilir olacaksın. 
                    Profil bilgilerini daha sonra güncelleyebilirsin.</p>
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
