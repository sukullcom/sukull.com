import Image from "next/image";
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

import { pickRandomMascotHead } from "@/lib/mascot-heads";

/**
 * Yükleme spinner'ının dönen baş görseli her render'da rastgele seçilir
 * (`public/heads/*` setinden). Bu component **server component**
 * — `Math.random()` SSR sırasında bir kez çalışır; her sayfa yüklemesinde farklı baş.
 */

export const LoadingSpinner = ({ size = "md" }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
  };
  const src = pickRandomMascotHead();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin">
        <Image
          src={src}
          alt="Sukull"
          width={sizeMap[size].width}
          height={sizeMap[size].height}
          priority
        />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">Yükleniyor...</p>
    </div>
  );
};
