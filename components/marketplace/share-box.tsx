"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <p className="mk-card p-4 text-sm leading-relaxed">{text}</p>
      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Kopyalandı");
          } catch {
            toast.error("Kopyalanamadı. Metni seçip kopyala.");
          }
        }}
      >
        {copied ? "Kopyalandı" : "Linki kopyala"}
      </Button>
    </div>
  );
}
