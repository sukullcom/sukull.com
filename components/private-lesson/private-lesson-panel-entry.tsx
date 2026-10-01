import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Misafirlerin özel ders pazarına yeşil giriş/kayıt CTA’sından ayrı,
 * mavi (`payment`) vurguyla ulaşması.
 */
export function PrivateLessonPanelEntry({
  showAudienceLabel = false,
  size = "lg",
}: {
  showAudienceLabel?: boolean;
  size?: "default" | "lg";
}) {
  return (
    <div className={showAudienceLabel ? "mb-6 w-full space-y-2" : "w-full"}>
      {showAudienceLabel ? (
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Öğretmen veya öğrenciysen
        </p>
      ) : null}
      <Button asChild variant="payment" size={size} className="w-full">
        <Link href="/private-lesson" prefetch={false}>
          Özel Ders Paneli
        </Link>
      </Button>
    </div>
  );
}
