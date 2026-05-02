"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedWrapper } from "@/components/feed-wrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "@/components/lazy-confetti";
import Image from "next/image";
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Mail, 
  FileText,
  GraduationCap
} from "lucide-react";

export default function TeacherSuccessPage() {
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const finishAudio = typeof window !== "undefined" ? (
    <audio src="/finish.mp3" autoPlay />
  ) : null;

  return (
    <div className="flex-1 mx-auto w-full max-w-[800px] px-3 lg:px-0">
      {finishAudio}
      <Confetti 
        width={dimensions.width} 
        height={dimensions.height} 
        recycle={false}
        numberOfPieces={200}
      />
      
      <FeedWrapper>
        {/* Success Card */}
        <Card className="border-2 border-suk-brand/35 shadow-xl">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-suk-brand-soft">
              <CheckCircle2 className="h-10 w-10 text-suk-brand" />
            </div>
            <CardTitle className="text-3xl text-suk-brand-border">Harika, başvurun alındı!</CardTitle>
            <CardDescription className="text-lg">
              Eğitmen başvurun alındı; sıradaki adım ekibimizin incelemesi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-suk-brand/30 bg-suk-brand-soft p-4">
              <p className="text-center text-foreground">
                Başvurunda ilettiğin bilgiler uygunluk teyidi için incelenecek;
                sonuç en kısa sürede paylaşılacak.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <GraduationCap className="h-5 w-5 text-suk-brand" />
                Sırada ne var?
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-suk-brand-soft">
                    <FileText className="h-4 w-4 text-suk-brand" />
                  </div>
                  <div>
                    <p className="font-medium">Başvuru incelemesi</p>
                    <p className="text-sm text-muted-foreground">
                      Ekibimiz başvurunu ve ilettiğin belgeleri kontrol eder; süre yoğunluğa
                      göre değişebilir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-suk-brand-soft">
                    <Mail className="h-4 w-4 text-suk-brand" />
                  </div>
                  <div>
                    <p className="font-medium">E-posta bildirimi</p>
                    <p className="text-sm text-muted-foreground">
                      Sonucu e-posta adresine göndereceğiz
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-suk-brand-soft">
                    <Clock className="h-4 w-4 text-suk-brand" />
                  </div>
                  <div>
                    <p className="font-medium">Profil aktivasyonu</p>
                    <p className="text-sm text-muted-foreground">
                      Onaylandığında eğitmen rehberinde görünür ve ilanlara teklif
                      verebilirsin; profilini istediğin zaman güncelleyebilirsin.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/private-lesson")}
                className="flex-1"
              >
                Özel derse dön
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="primaryOutline"
                size="lg"
                onClick={() => router.push("/courses")}
                className="flex-1"
              >
                Kurslara göz at
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mascot Image */}
        <div className="flex justify-center mt-8">
          <Image
            src="/mascot_pink.svg"
            alt="Mutlu maskot"
            width={150}
            height={150}
            className="animate-bounce"
          />
        </div>
      </FeedWrapper>
    </div>
  );
}
