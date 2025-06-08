import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Badge } from "@/components/ui/badge";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isApprovedStudent } from "@/db/queries";
import Image from "next/image";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Trophy,
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default async function PrivateLessonPage() {
  const user = await getServerUser();
  
  // Redirect to login if not logged in
  if (!user) {
    redirect("/login");
  }
  
  // Check user role directly from the database
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  
  // Check if user is a teacher by role
  if (userRecord?.role === "teacher") {
    redirect("/private-lesson/teacher-dashboard/bookings");
  }
  
  // If not a teacher by role, check if they have an approved student application
  const isStudent = await isApprovedStudent(user.id);
  
  if (isStudent) {
    redirect("/private-lesson/my-bookings");
  }
  
  // Only show this UI if user is neither a teacher nor a student
  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {/* Hero Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                    Özel Ders Platformu
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Alanında uzman öğretmenlerle birebir özel ders alın veya bilginizi paylaşarak öğretmen olun.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="secondary" className="px-3 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      4.9/5 Öğrenci Memnuniyeti
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1">
                      <Users className="w-4 h-4 mr-1" />
                      1000+ Aktif Öğretmen
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1">
                      <Trophy className="w-4 h-4 mr-1" />
                      10.000+ Başarılı Ders
                    </Badge>
                  </div>
                </div>
                <div className="relative">
                  <Image
                    src="/mascot_pink.svg"
                    alt="Mascot"
                    width={200}
                    height={200}
                    className="animate-bounce-slow"
                  />
                  <Sparkles className="absolute top-0 right-0 w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Teacher Option */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-green-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <CardTitle className="text-2xl">Öğretmen Ol</CardTitle>
              <CardDescription className="text-base">
                Bilgi ve deneyiminizi paylaşarak öğrencilere yardımcı olun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Kendi ders saatlerinizi belirleyin</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Ücretlerinizi kendiniz belirleyin</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Düzenli ek gelir elde edin</span>
                </li>
              </ul>
              <Button 
                asChild
                variant="default"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                size="lg"
              >
                <a href="/private-lesson/give">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Öğretmen Başvurusu Yap
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Student Option */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-blue-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <CardTitle className="text-2xl">Öğrenci Ol</CardTitle>
              <CardDescription className="text-base">
                Uzman öğretmenlerden özel ders alarak başarınızı artırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Alanında uzman öğretmenler</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Birebir kişiselleştirilmiş eğitim</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Esnek ders programları</span>
                </li>
              </ul>
              <Button 
                asChild
                variant="default"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                size="lg"
              >
                <a href="/private-lesson/get">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Öğrenci Başvurusu Yap
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Neden Bizi Tercih Etmelisiniz?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Esnek Zamanlama</h3>
                <p className="text-sm text-gray-600">
                  Kendi programınıza uygun ders saatlerini seçin
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Hızlı İlerleme</h3>
                <p className="text-sm text-gray-600">
                  Birebir eğitimle daha hızlı öğrenin ve gelişin
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Garantili Kalite</h3>
                <p className="text-sm text-gray-600">
                  Onaylı ve deneyimli öğretmenlerle çalışın
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FeedWrapper>

      <StickyWrapper>
        {/* Statistics Card */}
        <Card className="shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Platform İstatistikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Toplam Öğretmen</span>
              <span className="font-bold text-green-600">1,234</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktif Öğrenci</span>
              <span className="font-bold text-blue-600">5,678</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tamamlanan Ders</span>
              <span className="font-bold text-purple-600">12,345</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ortalama Puan</span>
              <span className="font-bold text-orange-600">4.9/5</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Hızlı İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Öğretmenler için:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Profilinizi detaylı doldurun</li>
                <li>Uygun fiyatlandırma yapın</li>
                <li>Düzenli geri bildirim alın</li>
              </ul>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Öğrenciler için:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Hedeflerinizi net belirtin</li>
                <li>Düzenli ders programı oluşturun</li>
                <li>Öğretmenle iletişimde kalın</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </StickyWrapper>
    </div>
  );
}
