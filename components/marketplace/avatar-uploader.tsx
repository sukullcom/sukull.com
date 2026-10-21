"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { uploadAvatar } from "@/actions/marketplace-account";
import { MarketAvatar } from "@/components/marketplace/market-avatar";

const AVATAR_PX = 320;

/** Fotoğrafı tarayıcıda kare olarak küçültür; telefon fotoğrafları birkaç MB'tan ~30 KB'a iner. */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(AVATAR_PX, side);
  canvas.height = canvas.width;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) return file;
  const ext = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `avatar.${ext}`, { type: blob.type });
}

export function AvatarUploader({ src, label = "Profil fotoğrafı" }: { src: string; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    const formData = new FormData();
    formData.set("file", await shrinkImage(file));
    const result = await uploadAvatar(formData);
    setPending(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Fotoğraf güncellendi");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => inputRef.current?.click()}
        aria-label={label}
        disabled={pending}
      >
        <MarketAvatar src={src} size={96} />
      </button>
      <button
        type="button"
        className="text-sm font-bold text-suk-brand"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? "Yükleniyor…" : "Fotoğrafı düzenle"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
