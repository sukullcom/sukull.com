"use client";

import { useState } from "react";
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
  Info
} from "lucide-react";

export default function GetLessonPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentSurname: "",
    studentPhoneNumber: "",
    studentEmail: "",
    field: "",
    studentNeeds: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

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

      if (res.ok) {
        router.push("/private-lesson/get/success");
      } else {
        toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form completion percentage
  const completionPercentage = () => {
    const requiredFields = [
      formData.studentName,
      formData.studentSurname,
      formData.studentPhoneNumber,
      formData.studentEmail,
      formData.field
    ];
    const completed = requiredFields.filter(f => f !== "").length;
    return Math.round((completed / 5) * 100);
  };

  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {/* Hero Section */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Öğrenci Başvurusu
                  </h1>
                  <p className="text-gray-600">
                    Size en uygun öğretmeni bulabilmemiz için formu eksiksiz doldurun
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
              Lütfen aşağıdaki formu doldurarak bize taleplerinizi iletin. Bu bilgiler, size en uygun öğretmeni bulmamıza yardımcı olacaktır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adınız <span className="text-red-500">*</span>
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
                    Soyadınız <span className="text-red-500">*</span>
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

              {/* Field Selection */}
              <div className="space-y-2">
                <Label htmlFor="field" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Ders Alanı <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.field} onValueChange={(value) => handleSelectChange("field", value)}>
                  <SelectValue placeholder="Hangi alanda özel ders almak istiyorsunuz?" />
                  <SelectItem value="Matematik">Matematik</SelectItem>
                  <SelectItem value="Fizik">Fizik</SelectItem>
                  <SelectItem value="Kimya">Kimya</SelectItem>
                  <SelectItem value="Biyoloji">Biyoloji</SelectItem>
                  <SelectItem value="İngilizce">İngilizce</SelectItem>
                  <SelectItem value="Türkçe">Türkçe</SelectItem>
                  <SelectItem value="Tarih">Tarih</SelectItem>
                  <SelectItem value="Coğrafya">Coğrafya</SelectItem>
                </Select>
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
                  placeholder="Örneğin: Sınavlara hazırlık, belirli bir konu hakkında daha fazla pratik, haftalık ders sayısı tercihiniz vb."
                  value={formData.studentNeeds}
                  onChange={handleChange}
                  rows={4}
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
                    <p>Bilgileriniz yalnızca size uygun öğretmeni belirlemek ve sizinle iletişim kurmak amacıyla kullanılacaktır. Kişisel verileriniz üçüncü kişilerle paylaşılmayacaktır.</p>
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
