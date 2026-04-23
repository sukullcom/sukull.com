import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-white">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/mascot_sad.svg"
            alt="Sukull"
            width={140}
            height={140}
            priority
          />
        </div>

        <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase mb-2">
          404
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mb-3">
          Sayfa bulunamadı
        </h1>
        <p className="text-neutral-600 mb-8">
          Aradığın sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          Aşağıdaki bağlantılardan devam edebilirsin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="secondary" size="lg">
            <Link href="/learn">Derslere dön</Link>
          </Button>
          <Button asChild variant="primaryOutline" size="lg">
            <Link href="/">Ana sayfa</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
