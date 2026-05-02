"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type Props = {
  teacherId: string;
  teacherName?: string;
  alreadyUnlocked?: boolean;
  existingChatId?: number | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  /** Full-width on mobile. */
  fullWidth?: boolean;
};

/**
 * Button students press to open a conversation with a listed teacher.
 *
 * Behavior:
 *   - First click (not unlocked yet) → confirm dialog explaining the
 *     1-credit cost; on OK, POST to /messages/unlock and navigate to
 *     the resulting chat.
 *   - Already unlocked → navigate straight to the chat.
 *
 * All server-side error cases (insufficient credits, self-unlock,
 * rate limit) surface as toasts; we don't silently fall through.
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
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);

  const doUnlock = async () => {
    if (loading) return;
    setCreditDialogOpen(false);
    setLoading(true);
    try {
      const res = await fetch("/api/private-lesson/messages/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        chatId?: number;
        alreadyUnlocked?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 402) {
        toast.error(
          data.error || "Yetersiz kredi. Kredi satın alın ve tekrar deneyin.",
        );
        router.push("/private-lesson/credits");
        return;
      }
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
        toast.success("Sohbet açıldı! 1 kredi kullanıldı.");
      }
      router.push(`/private-lesson/messages/${data.chatId}`);
    } catch (error) {
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

  const handleOpenClick = () => {
    if (loading) return;
    if (alreadyUnlocked && existingChatId) {
      router.push(`/private-lesson/messages/${existingChatId}`);
      return;
    }
    setCreditDialogOpen(true);
  };

  const label = teacherName ? `“${teacherName}”` : "bu eğitmen";
  const messageDescription = (
    <>
      <span className="block mb-2">
        {label} ile mesajlaşmayı açmak için{" "}
        <span className="font-semibold">1 kredi</span> kullanılır. Ödeme tek
        seferlidir; aynı sohbet için tekrar ücret alınmaz ve kredi iade edilmez.
      </span>
      <span className="block text-muted-foreground">
        Onayladığında, sohbet ekranında{" "}
        <span className="font-semibold">
          eğitmenin kayıtlı e-posta ve telefon bilgileri
        </span>{" "}
        sana gösterilir; senin kayıtlı e-posta ve telefon bilgilerin de eğitmenle
        paylaşılır. Devam etmeden önce profilindeki iletişim bilgilerinin güncel
        olduğundan emin ol.
      </span>
    </>
  );

  return (
    <>
      <Button
        type="button"
        onClick={handleOpenClick}
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
      <ConfirmActionDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        title="Mesajı aç?"
        description={messageDescription}
        confirmLabel="Evet, 1 kredi kullan"
        cancelLabel="Vazgeç"
        confirmVariant="primary"
        pending={loading}
        onConfirm={doUnlock}
      />
    </>
  );
}
