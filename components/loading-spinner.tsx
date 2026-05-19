import Image from "next/image";
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

/**
 * Yükleme spinner'ının dönen baş görseli her render'da rastgele seçilir
 * (`public/heads/*` setinden 21 farklı ifade). Bu component **server component**
 * — `Math.random()` SSR sırasında bir kez çalışır ve sabit HTML olarak istemciye
 * gönderildiği için hydration mismatch yok. Her yeni sayfa yüklemesinde
 * kullanıcı farklı bir maskot görür; site canlı hisseder.
 *
 * Yeni bir baş eklemek için `SPINNER_HEADS`'e yolu ekle, başka değişiklik gerekmez.
 */
const SPINNER_HEADS = [
  "/heads/ambitious_red.svg",
  "/heads/forgiveness_light_blue.svg",
  "/heads/happy_excited_purple.svg",
  "/heads/happy_heart_cute_pink.svg",
  "/heads/heart_with_hand_light_blue.svg",
  "/heads/hi_orange.svg",
  "/heads/hopeful_orange.svg",
  "/heads/liked_purple.svg",
  "/heads/look_my_eyes_dark_blue.svg",
  "/heads/look_my_eyes_orange.svg",
  "/heads/notr_yellow.svg",
  "/heads/okay_happy_yellow.svg",
  "/heads/perfect_pink.svg",
  "/heads/pointing_finger_happy_orange.svg",
  "/heads/sad_blue.svg",
  "/heads/sad_dark_blue.svg",
  "/heads/showing_with_hand_dark_blue.svg",
  "/heads/sleeping_blue.svg",
  "/heads/suprised_yellow.svg",
  "/heads/thoughtful_blue.svg",
  "/heads/twinkle_eye_purple.svg",
] as const;

function pickSpinnerHead(): string {
  return SPINNER_HEADS[Math.floor(Math.random() * SPINNER_HEADS.length)];
}

export const LoadingSpinner = ({ size = "md" }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
  };
  const src = pickSpinnerHead();

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
