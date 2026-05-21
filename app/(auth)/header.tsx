// app/(auth)/header.tsx
"use client";

import Image from "next/image";

import { BRAND_MASCOT_DISPLAY_PATH } from "@/lib/brand-mascot";

export const Header = () => {
  return (
    <header className="h-20 w-full border-b-2 border-border px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image
            src={BRAND_MASCOT_DISPLAY_PATH}
            height={40}
            width={40}
            alt="Sukull"
            className="object-contain"
          />
          <h1 className="text-2xl font-extrabold tracking-wide text-suk-brand">
            Sukull
          </h1>
        </div>
      </div>
    </header>
  );
};
