import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Badge } from "@/components/ui/badge";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import {
  GraduationCap,
  Users,
  BookOpen,
  Trophy,
  Star,
  Sparkles,
  Check,
  Megaphone,
  MessageCircle,
  Wallet,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Public entry for the private-lesson area. After the marketplace
 * refactor the former "apply as student" flow is gone: any logged-in
 * user can browse teachers and post demand listings. Teachers still
 * go through a review, so the landing behaviour now is:
 *   - not logged in  -> /login
 *   - teacher role   -> /private-lesson/teacher-dashboard
 *   - everyone else  -> marketing page with two CTAs (browse / post)
 */
export default async function PrivateLessonPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  if (userRecord?.role === "teacher") {
    redirect("/private-lesson/teacher-dashboard");
  }

  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {/* Hero */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                    Özel Ders Pazarı
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Alanında uzman öğretmenlere ulaş ya da ilan aç, teklifler
                    sana gelsin. Tek tıkla iletişime geç, krediyle ödeme yap.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Badge
                      variant="secondary"
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Doğrulanmış Öğretmenler
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
                    >
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Hızlı Eşleşme
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
                    >
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Kredi Tabanlı Adil Sistem
                    </Badge>
                  </div>
                </div>
                <div className="relative hidden sm:block">
                  <Image
                    src="/mascot_pink.svg"
                    alt="Maskot"
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

        {/* Primary student CTAs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-blue-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                Öğretmen Bul
              </CardTitle>
              <CardDescription className="text-base">
                Alanında onaylı öğretmenleri listele, filtreleyip mesaj gönder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <Feature label="Branş, şehir, online/yüz yüze filtreleri" />
                <Feature label="Saatlik ücret açıkça görünür" />
                <Feature label="Mesaj kilidi tek seferlik 1 kredi" />
              </ul>
              <Button asChild variant="primary" size="lg">
                <a href="/private-lesson/teachers">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Öğretmen Listesine Git
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-yellow-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors">
                  <Megaphone className="w-8 h-8 text-yellow-600" />
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-yellow-600 transition-colors" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                İlan Aç
              </CardTitle>
              <CardDescription className="text-base">
                Ne öğrenmek istediğini yaz, öğretmenler sana teklif gönderir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <Feature label="Öğrenciler için ilan açmak tamamen ücretsiz" />
                <Feature label="Her ilana en fazla 4 teklif" />
                <Feature label="İstediğin teklifi kabul et, istediğinle iletişime geç" />
              </ul>
              <Button asChild variant="secondary" size="lg">
                <a href="/private-lesson/listings/new">
                  <Megaphone className="w-4 h-4 mr-2" />
                  İlanımı Oluştur
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Teacher CTA */}
        <Card className="shadow-lg mb-8 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-white rounded-full shrink-0">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                Ders vermek istiyor musun?
              </h2>
              <p className="text-sm text-gray-600">
                Kısa bir başvuru formuyla profilini oluştur, onaylandıktan sonra
                öğrenciler sana mesaj gönderebilir ve ilanlara teklif verebilirsin.
              </p>
            </div>
            <Button asChild variant="primary" size="lg">
              <a href="/private-lesson/give">
                <GraduationCap className="w-4 h-4 mr-2" />
                Öğretmen Ol
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Nasıl çalışır?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <HowItem
                icon={BookOpen}
                color="blue"
                title="1. Keşfet"
                desc="Öğretmen listesinden ya da açık ilanlar üzerinden aradığını bul."
              />
              <HowItem
                icon={MessageCircle}
                color="green"
                title="2. İletişime geç"
                desc="Krediyle öğretmen mesaj kilidini aç ya da ilanına gelen teklifleri değerlendir."
              />
              <HowItem
                icon={Wallet}
                color="yellow"
                title="3. Anlaş"
                desc="Fiyatı, yeri, saati doğrudan konuş. Platform aradan çekilir."
              />
            </div>
          </CardContent>
        </Card>
      </FeedWrapper>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
        <Check className="w-4 h-4 text-green-500" />
      </div>
      <span className="text-gray-600">{label}</span>
    </li>
  );
}

function HowItem({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "yellow";
  title: string;
  desc: string;
}) {
  const bg: Record<typeof color, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };
  return (
    <div className="text-center">
      <div
        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${bg[color]}`}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}
