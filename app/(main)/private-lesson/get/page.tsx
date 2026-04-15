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
  MessageSquare,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  Timer,
  Calendar,
  Wallet,
  Monitor
} from "lucide-react";

type ApplicationStatus = {
  hasApplication: boolean;
  status?: string;
  field?: string;
  createdAt?: string;
};

export default function GetLessonPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentSurname: "",
    studentPhoneNumber: "",
    studentEmail: "",
    field: "",
    studentLevel: "",
    lessonDuration: "",
    availableHours: "",
    budget: "",
    lessonMode: "",
    studentNeeds: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const res = await fetch("/api/private-lesson/get");
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/private-lesson/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/private-lesson/get/success");
      } else {
        toast.error(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = () => {
    const requiredFields = [
      formData.studentName,
      formData.studentSurname,
      formData.studentPhoneNumber,
      formData.studentEmail,
      formData.field,
      formData.studentLevel,
    ];
    const optionalFields = [
      formData.lessonDuration,
      formData.availableHours,
      formData.budget,
      formData.lessonMode,
    ];
    const requiredCompleted = requiredFields.filter(f => f !== "").length;
    const optionalCompleted = optionalFields.filter(f => f !== "").length;
    return Math.round(((requiredCompleted + optionalCompleted * 0.5) / (requiredFields.length + optionalFields.length * 0.5)) * 100);
  };

  if (loading) {
    return (
      <div className="flex-1 mx-auto w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
                <strong>{appStatus.field}</strong> alanındaki öğrenci başvurun inceleniyor.
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Başvurun onaylandı!</h2>
              <p className="text-gray-600 mb-6">
                Öğrenci başvurun onaylandı! Artık öğretmen listesinden ders ayırtabilirsin.
              </p>
              <Button variant="secondary" onClick={() => router.push("/private-lesson/teachers")}>
                Öğretmenleri Görüntüle
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
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Öğrenci Başvurusu
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sana en uygun öğretmeni bulabilmemiz için formu eksiksiz doldur
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
                  <span className="text-sm font-semibold text-blue-600">{completionPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
              <BookOpen className="w-6 h-6 text-blue-500" />
              Başvuru Formu
            </CardTitle>
            <CardDescription>
              Aşağıdaki formu doldurarak bize taleplerini ilet. Bu bilgiler, sana en uygun öğretmeni bulmamıza yardımcı olacak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adın <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    type="text"
                    placeholder="Örneğin: Ahmet"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentSurname" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Soyadın <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentSurname"
                    name="studentSurname"
                    type="text"
                    placeholder="Örneğin: Yılmaz"
                    value={formData.studentSurname}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentPhoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefon Numarası <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentPhoneNumber"
                    name="studentPhoneNumber"
                    type="tel"
                    placeholder="05xx xxx xx xx"
                    value={formData.studentPhoneNumber}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta Adresi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={formData.studentEmail}
                    onChange={handleChange}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Field & Level Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Ders Alanı <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.field} onValueChange={(value) => handleSelectChange("field", value)}>
                    <SelectValue placeholder="Ders alanı seç" />
                    <SelectItem value="Matematik">Matematik</SelectItem>
                    <SelectItem value="Fizik">Fizik</SelectItem>
                    <SelectItem value="Kimya">Kimya</SelectItem>
                    <SelectItem value="Biyoloji">Biyoloji</SelectItem>
                    <SelectItem value="İngilizce">İngilizce</SelectItem>
                    <SelectItem value="Türkçe">Türkçe</SelectItem>
                    <SelectItem value="Tarih">Tarih</SelectItem>
                    <SelectItem value="Coğrafya">Coğrafya</SelectItem>
                    <SelectItem value="Edebiyat">Edebiyat</SelectItem>
                    <SelectItem value="Felsefe">Felsefe</SelectItem>
                    <SelectItem value="Bilgisayar Bilimleri">Bilgisayar Bilimleri</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentLevel" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Sınıf / Seviye <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.studentLevel} onValueChange={(value) => handleSelectChange("studentLevel", value)}>
                    <SelectValue placeholder="Seviyeni seç" />
                    <SelectItem value="İlkokul (1-4)">İlkokul (1-4)</SelectItem>
                    <SelectItem value="Ortaokul (5-8)">Ortaokul (5-8)</SelectItem>
                    <SelectItem value="Lise (9-12)">Lise (9-12)</SelectItem>
                    <SelectItem value="Üniversite Hazırlık">Üniversite Hazırlık</SelectItem>
                    <SelectItem value="Üniversite">Üniversite</SelectItem>
                    <SelectItem value="Yetişkin / Genel">Yetişkin / Genel</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Lesson Preferences */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonDuration" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Tercih Edilen Ders Süresi
                  </Label>
                  <Select value={formData.lessonDuration} onValueChange={(value) => handleSelectChange("lessonDuration", value)}>
                    <SelectValue placeholder="Ders süresi seç" />
                    <SelectItem value="30">30 dakika</SelectItem>
                    <SelectItem value="45">45 dakika</SelectItem>
                    <SelectItem value="60">60 dakika</SelectItem>
                    <SelectItem value="90">90 dakika</SelectItem>
                    <SelectItem value="120">120 dakika</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonMode" className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Ders Şekli
                  </Label>
                  <Select value={formData.lessonMode} onValueChange={(value) => handleSelectChange("lessonMode", value)}>
                    <SelectValue placeholder="Ders şekli seç" />
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Yüz yüze">Yüz yüze</SelectItem>
                    <SelectItem value="Farketmez">Farketmez</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Bütçe Beklentisi (Saat başı)
                  </Label>
                  <Select value={formData.budget} onValueChange={(value) => handleSelectChange("budget", value)}>
                    <SelectValue placeholder="Bütçe aralığı seç" />
                    <SelectItem value="0-200 TL">0-200 TL</SelectItem>
                    <SelectItem value="200-400 TL">200-400 TL</SelectItem>
                    <SelectItem value="400-600 TL">400-600 TL</SelectItem>
                    <SelectItem value="600+ TL">600+ TL</SelectItem>
                    <SelectItem value="Farketmez">Farketmez</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-2">
                <Label htmlFor="studentNeeds" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ek Bilgiler (Opsiyonel)
                </Label>
                <Textarea
                  id="studentNeeds"
                  name="studentNeeds"
                  placeholder="Örneğin: Sınavlara hazırlık, belirli bir konu hakkında daha fazla pratik, haftalık ders sayısı tercihin vb."
                  value={formData.studentNeeds}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="resize-none transition-all duration-200 focus:scale-[1.01]"
                />
                <p className="text-xs text-gray-500">
                  {formData.studentNeeds.length}/500 karakter
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Gizlilik Bildirimi</p>
                    <p>Bilgilerin yalnızca sana uygun öğretmeni belirlemek ve seninle iletişim kurmak amacıyla kullanılacak. Kişisel verilerin üçüncü kişilerle paylaşılmayacak.</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                variant="secondary"
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
