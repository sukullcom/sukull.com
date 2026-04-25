"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

type Props = {
  teacherId: string;
  teacherName?: string;
  /**
   * When true, the student has already unlocked messaging with this
   * teacher. We skip the confirm dialog and just navigate.
   */
  alreadyUnlocked?: boolean;
  existingChatId?: number | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?:
    | "primary"
    | "primaryOutline"
    | "secondary"
    | "super"
    | "superOutline";
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

  const handleClick = async () => {
    if (loading) return;

    if (alreadyUnlocked && existingChatId) {
      router.push(`/private-lesson/messages/${existingChatId}`);
      return;
    }

    const label = teacherName ? `"${teacherName}"` : "bu öğretmen";
    const ok = window.confirm(
      `${label} ile mesajlaşmayı açmak için 1 kredi kullanılacak. Bir kez ödenir, mesajlaşma kalıcı olarak açık kalır. Devam edilsin mi?`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/private-lesson/messages/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 402) {
        toast.error(
          data.error || "Yetersiz kredi. Kredi satın alın ve tekrar deneyin.",
        );
        router.push("/private-lesson/credits");
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
        location: "MessageTeacherButton/handleClick",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
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
  );
}
