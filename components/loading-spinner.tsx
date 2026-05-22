"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";
import { pickRandomMascotHead } from "@/lib/mascot-heads";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

/**
 * Yükleme spinner'ı.
 *
 * KRİTİK: SSR ve ilk client render AYNI `src` ile yapılmalı — aksi halde
 * `Math.random()` server'da bir, hydration sırasında başka bir maskot seçer,
 * Image `src`'leri uyuşmaz ve React #419 ("the entire root will switch to
 * client rendering") tetiklenir. Bu component 30+ `loading.tsx` Suspense
 * fallback'inde kullanıldığından, hata neredeyse her sayfada yaşanıyordu.
 *
 * Çözüm: SSR sırasında stabil `BRAND_MASCOT_PATH` göster; hydration tamamlanıp
 * `useEffect` çalıştıktan SONRA rastgele bir maskota geç. Kullanıcı algısında
 * "her yüklemede farklı baş" UX'i korunur, hydration mismatch yok.
 */

const SIZE_MAP = {
  sm: { width: 48, height: 48 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
} as const;

export const LoadingSpinner = ({ size = "md" }: LoadingSpinnerProps) => {
  const [src, setSrc] = useState<string>(BRAND_MASCOT_PATH);

  useEffect(() => {
    setSrc(pickRandomMascotHead());
  }, []);

  const { width, height } = SIZE_MAP[size];

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin">
        <Image
          src={src}
          alt="Sukull"
          width={width}
          height={height}
          priority
          unoptimized
        />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">Yükleniyor...</p>
    </div>
  );
};
