"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import {
  fetchAfterMarketplaceIdentity,
  useMarketplaceIdentityGate,
} from "@/components/private-lesson/marketplace-identity-gate";

type Props = {
  teacherId: string;
  teacherName?: string;
  alreadyUnlocked?: boolean;
  existingChatId?: number | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  fullWidth?: boolean;
  isAuthenticated?: boolean;
};

/**
 * Öğrencinin listelenen eğitmenle sohbet açması.
 * 401 olursa pazar kimliği kapısı, ardından işlem tekrarlanır.
 */
export function MessageTeacherButton({
  teacherId,
  teacherName,
  alreadyUnlocked = false,
  existingChatId = null,
  className,
  size = "default",
  variant = "primary",
  fullWidth = false,
  isAuthenticated = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const { ensureIdentity, gate } = useMarketplaceIdentityGate({
    studentContactChoice: true,
  });

  const doUnlock = async () => {
    if (loading) return;
    setCreditDialogOpen(false);
    setLoading(true);
    try {
      const res = await fetchAfterMarketplaceIdentity(async () => {
        const token = await mintCsrfToken();
        if (!token) {
          throw new Error("csrf");
        }
        return fetch("/api/private-lesson/messages/unlock", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(token),
          },
          body: JSON.stringify({ teacherId }),
        });
      }, ensureIdentity);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        chatId?: number;
        alreadyUnlocked?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 401) return;
      if (res.status === 429) {
        const ra =
          typeof data.retryAfterSeconds === "number" && Number.isFinite(data.retryAfterSeconds)
            ? Math.max(0, Math.ceil(data.retryAfterSeconds))
            : null;
        const waitHint =
          ra != null && ra > 0
            ? ra >= 60
              ? ` Yaklaşık ${Math.ceil(ra / 60)} dk sonra tekrar dene.`
              : ` Yaklaşık ${ra} sn sonra tekrar dene.`
            : "";
        toast.error(
          (data.error || "Çok sık deneme yapıldı. Biraz bekleyip tekrar dene.") + waitHint,
        );
        return;
      }
      if (res.status === 503) {
        toast.error(
          data.error ||
            "Geçici bir sorun oluştu. Bir dakika sonra tekrar dene.",
        );
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Sohbet açılamadı");
        return;
      }

      if (!data.alreadyUnlocked) {
        toast.success("Sohbet açıldı.");
      }
      router.push(`/private-lesson/messages/${data.chatId}`);
    } catch (error) {
      if (error instanceof Error && error.message === "csrf") {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        return;
      }
      clientLogger.error({
        message: "unlock message thread failed",
        error,
        location: "MessageTeacherButton/doUnlock",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClick = async () => {
    if (loading) return;
    if (alreadyUnlocked && existingChatId) {
      router.push(`/private-lesson/messages/${existingChatId}`);
      return;
    }
    if (!isAuthenticated) {
      const ok = await ensureIdentity();
      if (!ok) return;
    }
    setCreditDialogOpen(true);
  };

  const label = teacherName ? `“${teacherName}”` : "bu eğitmen";
  const messageDescription = (
    <>
      <span className="block mb-2">
        {label} ile sohbeti ücretsiz açacaksın. Aynı sohbet için tekrar işlem
        gerekmez.
      </span>
      <span className="block text-muted-foreground">
        Onayladığında, sohbet ekranında{" "}
        <span className="font-semibold">
          eğitmenin kayıtlı e-posta ve telefon bilgileri
        </span>{" "}
        sana gösterilir; senin tercih ettiğin iletişim bilgisi (e-posta veya
        telefon) da eğitmenle paylaşılır.
      </span>
    </>
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => void handleOpenClick()}
        disabled={loading}
        variant={variant}
        size={size}
        className={`${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4 mr-2" />
        )}
        {alreadyUnlocked ? "Sohbete Git" : "Mesaj Gönder"}
      </Button>
      {gate}
      <ConfirmActionDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        title="Sohbeti aç?"
        description={messageDescription}
        confirmLabel="Sohbeti aç"
        cancelLabel="Vazgeç"
        confirmVariant="primary"
        pending={loading}
        onConfirm={doUnlock}
      />
    </>
  );
}
