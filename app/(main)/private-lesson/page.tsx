import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isTeacher } from "@/db/queries/applications";
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

  if (await isTeacher(user.id)) {
    redirect("/private-lesson/teacher-dashboard");
  }

  return (
    <div className="flex-1 mx-auto w-full flex flex-row max-w-[1200px] px-3 lg:px-0">
      <FeedWrapper>
        {/* Hero */}
        <div className="mb-8">
          <Card className="border-suk-brand/30 bg-gradient-to-br from-suk-brand-soft to-suk-brand-soft/60 shadow-lg">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:gap-8 lg:flex-row">
                <div className="flex-1">
                  <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                    Özel Ders Pazarı
                  </h1>
                  <p className="mb-6 text-lg text-muted-foreground">
                    Alanında uzman eğitmenlere ulaş ya da talep ilanı aç; teklifler
                    sana gelsin. İletişimi krediyle aç, koşulları birlikte netleştirin.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Badge
                      variant="secondary"
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Onaylı eğitmenler
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
                  <Sparkles className="absolute right-0 top-0 h-8 w-8 animate-pulse text-suk-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">İnceleme ve teyit</p>
          <p>
            Talep ilanları ile eğitmen başvuruları Sukull ekibi tarafından kontrol
            edilir; yanıltıcı, eksik veya kurallara aykırı içerik yayından
            kaldırılabilir veya başvuru reddedilebilir. Tekrar edilen durumlar için hesap kapatılabilir.
          </p>
        </div>

        {/* Primary student CTAs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="group border-2 transition-all duration-300 hover:scale-[1.02] hover:border-suk-brand/45 hover:shadow-xl">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="rounded-full bg-suk-brand-soft p-3 transition-colors group-hover:bg-suk-brand-soft/80">
                  <BookOpen className="h-8 w-8 text-suk-brand" />
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-suk-brand" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                Eğitmen bul
              </CardTitle>
              <CardDescription className="text-base">
                Onaylı eğitmenleri listele, filtrele; uygun olanla sohbeti krediyle aç.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <Feature label="Branş, şehir, online/yüz yüze filtreleri" />
                <Feature label="Saatlik ücret açıkça görünür" />
                <Feature label="1 kredi eğitmen ile sohbet kilidini açabilirsin" />
              </ul>
              <Button asChild variant="primary" size="lg">
                <a href="/private-lesson/teachers">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Eğitmen rehberine git
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-2 transition-all duration-300 hover:scale-[1.02] hover:border-suk-warning/50 hover:shadow-xl">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="rounded-full bg-suk-warning-soft p-3 transition-colors group-hover:bg-suk-warning-border/40">
                  <Megaphone className="h-8 w-8 text-suk-warning-soft-fg" />
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-suk-warning-soft-fg" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                İlan Aç
              </CardTitle>
              <CardDescription className="text-base">
                Ne öğrenmek istediğini yaz; eğitmenler sana teklif gönderir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <Feature label="Öğrenciler için ilan açmak tamamen ücretsiz" />
                <Feature label="İlanların uygunluk kontrolünden geçer; kurallara uymayan içerik kaldırılabilir" />
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
        <Card className="mb-8 border-suk-brand/30 bg-gradient-to-br from-suk-brand-soft to-suk-brand-soft/70 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
            <div className="shrink-0 rounded-full bg-card p-3">
              <GraduationCap className="h-8 w-8 text-suk-brand" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="mb-1 text-xl font-bold text-foreground">
                Ders vermek istiyor musun?
              </h2>
              <p className="mb-2 text-sm text-muted-foreground">
                Kısa eğitmen başvurusuyla rehbere gir; onaylandıktan sonra öğrenciler
                sana mesaj gönderebilir, açık ilanlara teklif verebilirsin.
              </p>
              <p className="text-xs text-muted-foreground/90">
                Kurumda veya birebir zaten ders veriyor olsan da, burada listelenmek
                için bu başvuruyu tamamlaman gerekir; aynı hesaptan öğrenci akışını da
                kullanmaya devam edebilirsin.
              </p>
            </div>
            <Button asChild variant="primary" size="lg">
              <a href="/private-lesson/give">
                <GraduationCap className="w-4 h-4 mr-2" />
                Eğitmen başvurusu
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
                color="brand"
                title="1. Keşfet"
                desc="Eğitmen rehberinden ya da açık ilanlardan aradığını bul."
              />
              <HowItem
                icon={MessageCircle}
                color="brand"
                title="2. İletişime geç"
                desc="Krediyle eğitmenle sohbeti aç ya da ilanına gelen teklifleri değerlendir."
              />
              <HowItem
                icon={Wallet}
                color="payment"
                title="3. Anlaş"
                desc="Ücret, yer ve saati mesajda netleştirin. Anlaşma tarafların sorumluluğundadır."
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
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-suk-brand-soft">
        <Check className="h-4 w-4 text-suk-brand" />
      </div>
      <span className="text-muted-foreground">{label}</span>
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
  color: "brand" | "payment" | "warning";
  title: string;
  desc: string;
}) {
  const bg: Record<typeof color, string> = {
    brand: "bg-suk-brand-soft text-suk-brand",
    payment: "bg-suk-payment-soft text-suk-payment",
    warning: "bg-suk-warning-soft text-suk-warning-soft-fg",
  };
  return (
    <div className="text-center">
      <div
        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${bg[color]}`}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
