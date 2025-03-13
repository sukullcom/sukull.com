// app/(auth)/footer.tsx
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

export function Footer() {
  return (
    <footer className="hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2">
      <div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
        <Button size="lg" variant="ghost" className="w-full">
          <Image
            src="/mascot_blue.svg"
            alt="Croatian"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Matematİk
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Image
            src="/mascot_orange.svg"
            alt="Spanish"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Kodlama
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Image
            src="/mascot_pink.svg"
            alt="French"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Yabancı Dİl
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Image
            src="/mascot_red.svg"
            alt="Italian"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Hobİ Derslerİ
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Image
            src="/mascot_normal.svg"
            alt="Japanese"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          ve daha fazlası...
        </Button>
      </div>
    </footer>
  );
}
