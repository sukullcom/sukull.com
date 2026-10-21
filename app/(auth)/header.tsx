// app/(auth)/header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

import { BRAND_MASCOT_DISPLAY_PATH } from "@/lib/brand-mascot";

export const Header = () => {
  return (
    <header className="h-20 w-full border-b-2 border-border px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
        <Link href="/" className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image
            src={BRAND_MASCOT_DISPLAY_PATH}
            height={40}
            width={40}
            alt=""
            className="object-contain"
          />
          <span className="text-2xl font-extrabold tracking-wide text-suk-brand">
            Sukull
          </span>
        </Link>
      </div>
    </header>
  );
};
