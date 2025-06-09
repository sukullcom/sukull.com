"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { toast } from "sonner";
import Image from "next/image";
import { 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  DollarSign,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
  Clock,
  Users,
  Target,
  Award
} from "lucide-react";

export default function GiveLessonPage() {
  const [field, setField] = useState("");
  const [formData, setFormData] = useState({
    teacherName: "",
    teacherSurname: "",
    teacherPhoneNumber: "",
    teacherEmail: "",
    priceRange: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleChangeField = (value: string) => {
    setField(value);
  };

  const handleFormInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePriceRangeChange = (value: string) => {
    setFormData({ ...formData, priceRange: value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!field) {
      return toast.error("Lütfen bir alan seçiniz.");
    }
    
    setIsSubmitting(true);
    
    const body = {
      ...formData,
      field,
      // Setting these values as not needed but maintaining DB compatibility
      quizResult: 0,
      passed: true,
    };

    try {
      const res = await fetch("/api/private-lesson/give", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
        return;
      }
      
      router.push("/private-lesson/give/success");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form completion percentage
  const completionPercentage = () => {
    const fields = [field, formData.teacherName, formData.teacherSurname, formData.teacherPhoneNumber, formData.teacherEmail, formData.priceRange];
    const completed = fields.filter(f => f !== "").length;
    return Math.round((completed / 6) * 100);
  };

  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {/* Hero Section */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Öğretmen Başvurusu
                  </h1>
                  <p className="text-gray-600">
                    Bilgi ve deneyiminizi paylaşarak öğrencilere yardımcı olun
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
              Lütfen tüm alanları eksiksiz doldurunuz. Başvurunuz onaylandıktan sonra öğrenciler tarafından görülebilir olacaksınız.
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
                <Select value={field} onValueChange={handleChangeField}>
                  <SelectValue placeholder="Hangi alanda ders vermek istiyorsunuz?" />
                  <SelectItem value="English">İngilizce</SelectItem>
                  <SelectItem value="Mathematics">Matematik</SelectItem>
                  <SelectItem value="Physics">Fizik</SelectItem>
                  <SelectItem value="Chess">Satranç</SelectItem>
                </Select>
              </div>

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adınız <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="teacherName"
                    name="teacherName"
                    type="text"
                    placeholder="Örn: Ahmet"
                    value={formData.teacherName}
                    onChange={handleFormInput}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherSurname" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Soyadınız <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="teacherSurname"
                    name="teacherSurname"
                    type="text"
                    placeholder="Örn: Yılmaz"
                    value={formData.teacherSurname}
                    onChange={handleFormInput}
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
                    onChange={handleFormInput}
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
                    onChange={handleFormInput}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label htmlFor="priceRange" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Ücret Aralığı <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.priceRange} onValueChange={handlePriceRangeChange}>
                  <SelectValue placeholder="Ders ücreti aralığınızı seçin" />
                  <SelectItem value="0-100 TL">0-100 TL / Saat</SelectItem>
                  <SelectItem value="100-200 TL">100-200 TL / Saat</SelectItem>
                  <SelectItem value="200-300 TL">200-300 TL / Saat</SelectItem>
                  <SelectItem value="300+ TL">300+ TL / Saat</SelectItem>
                </Select>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Önemli Bilgilendirme</p>
                    <p>Başvurunuz onaylandıktan sonra öğrenciler tarafından görülebilir olacaksınız. 
                    Profil bilgilerinizi daha sonra güncelleyebilirsiniz.</p>
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
