import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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
import { ArrowRight, BookOpen, GraduationCap, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Özel ders pazarı girişi — öğrenci ve eğitmen akışları aynı hesapta birlikte kullanılabilir.
 */
export default async function PrivateLessonPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const teacherMode = await isTeacher(user.id);

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-row px-3 lg:px-0">
      <FeedWrapper>
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Özel ders pazarı
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Öğrenciler eğitmen arar veya ilan açar; eğitmenler teklif verir, mesajlaşır.
            İkisini de buradan yürütürsün.
          </p>
        </header>

        <p className="mb-8 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Bilgi: </span>
          İlanlar ve eğitmen başvuruları uygunluk kontrolünden geçer. Kurallara aykırı veya
          yanıltıcı içerik kaldırılabilir; tekrarlayan ihlallerde hesap kapatılabilir.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-suk-brand-soft text-suk-brand">
                  <BookOpen className="h-5 w-5" aria-hidden />
                </span>
                Ders almak istiyorsan…
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Branş ve ücret yan yana; kiminle iletişime geçeceğine sen karar verirsin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Eğitmen listesinde gezebilir veya ne aradığını yazarak ilan açabilirsin.
                İlgilenenler teklif gönderebilir (ilan başına en fazla dört). Mesaj için
                paketten kullanım hakkı kullanırsın.
              </p>
              <p className="text-xs text-muted-foreground/90">
                Merak ettiğin branşa bir göz atmak çoğu zaman yeterli olur.
              </p>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <Button asChild variant="primary" className="sm:flex-1">
                  <Link href="/private-lesson/teachers" prefetch={false}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Eğitmenlere göz atalım
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="sm:flex-1">
                  <Link href="/private-lesson/listings/new" prefetch={false}>
                    <Megaphone className="mr-2 h-4 w-4" />
                    Bir ilan yaz, teklifler gelsin
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-suk-brand-soft text-suk-brand">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </span>
                Ders veriyorsan…
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Başvurun onaylanınca öğrenciler yazabilir; açık ilanlara sen de teklif
                verirsin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Profilinde ücret ve ders şeklini (online / yüz yüze vb.) güncellersin;
                ilanlara teklif gönderebilir, gelen mesajları yanıtlayabilirsin.
              </p>
              <p>
                İstersen aynı hesaptan öğrenci olarak da ilan açıp eğitmen arayabilirsin.
              </p>
              <p className="text-xs text-muted-foreground/90">
                İlk teklif için &quot;mükemmel an&quot; beklemene gerek yok; kısa bir merhaba
                bile yeter.
              </p>
              {teacherMode ? (
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                  <Button asChild variant="primary" className="sm:flex-1">
                    <Link href="/private-lesson/teacher-dashboard" prefetch={false}>
                      Eğitmen paneline git
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="sm:flex-1">
                    <Link
                      href="/private-lesson/teacher-dashboard/settings"
                      prefetch={false}
                    >
                      Profilini güncelle
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button asChild variant="primary" className="w-full sm:w-auto">
                  <Link href="/private-lesson/give" prefetch={false}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Eğitmen başvurusuna atla
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </FeedWrapper>
    </div>
  );
}
