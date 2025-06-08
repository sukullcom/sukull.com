"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedWrapper } from "@/components/feed-wrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
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
    <audio src="/sounds/success.mp3" autoPlay />
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
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-600">Başvurunuz Alındı!</CardTitle>
            <CardDescription className="text-lg">
              Öğretmen başvurunuz başarıyla kaydedildi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-700 text-center">
                Özel ders verebilmek için yaptığınız başvurunuz bize ulaştı. 
                Bilgilerinizi inceleyip en kısa sürede sizinle iletişime geçeceğiz.
              </p>
            </div>

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                Bundan Sonra Ne Olacak?
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Başvuru İncelemesi</p>
                    <p className="text-sm text-gray-600">
                      Ekibimiz başvurunuzu 24-48 saat içinde inceleyecek
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">E-posta Bildirimi</p>
                    <p className="text-sm text-gray-600">
                      Başvuru sonucunuz e-posta adresinize gönderilecek
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Profil Aktivasyonu</p>
                    <p className="text-sm text-gray-600">
                      Onaylandıktan sonra hemen ders vermeye başlayabilirsiniz
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/courses")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Kurslara Göz At
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Ana Sayfaya Dön
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mascot Image */}
        <div className="flex justify-center mt-8">
          <Image
            src="/mascot_happy.svg"
            alt="Happy Mascot"
            width={150}
            height={150}
            className="animate-bounce"
          />
        </div>
      </FeedWrapper>
    </div>
  );
}
