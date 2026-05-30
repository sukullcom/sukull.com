import { Gift } from "lucide-react";

import {
  isPromotionAccent,
  listPromotionsForAdmin,
  type PromotionAccent,
} from "@/lib/promotions";
import { PromotionsAdminClient } from "./promotions-admin-client";

/**
 * Admin → Çekiliş & Kampanya
 *
 * Server component that loads every promotion (active, scheduled, ended)
 * with denormalised entry counts, then hands the data to a client island
 * for the CRUD form, list, and winner picker.
 *
 * The list reads happen in a server component so the admin sees fresh
 * counts on every navigation (`force-dynamic` mirrors the rest of the
 * admin surface).
 */
export const dynamic = "force-dynamic";

export default async function PromotionsAdminPage() {
  const promotions = await listPromotionsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-7 w-7 text-foreground" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Çekiliş & Kampanya
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Öğrencilerin learn ekranında günlük ilerleme widget&apos;ının üstünde
        gösterilecek çekiliş bannerları. Aktif zaman penceresi içindeki ve
        aktif bayrağı açık olan kampanyalar yayınlanır; aynı anda birden
        fazlası varsa alt alta dizilir.
      </p>

      <PromotionsAdminClient
        initialPromotions={promotions.map((promo) => ({
          id: promo.id,
          kind: promo.kind,
          title: promo.title,
          description: promo.description,
          prize: promo.prize,
          ctaLabel: promo.ctaLabel,
          rules: promo.rules,
          accentColor: (isPromotionAccent(promo.accentColor)
            ? promo.accentColor
            : "violet") satisfies PromotionAccent,
          imageUrl: promo.imageUrl,
          startsAt: promo.startsAt instanceof Date
            ? promo.startsAt.toISOString()
            : new Date(promo.startsAt).toISOString(),
          endsAt: promo.endsAt instanceof Date
            ? promo.endsAt.toISOString()
            : new Date(promo.endsAt).toISOString(),
          isActive: promo.isActive,
          winnerUserId: promo.winnerUserId,
          winnerName: promo.winnerName,
          winnerAnnounced: promo.winnerAnnounced,
          winnerPickedAt: promo.winnerPickedAt
            ? (promo.winnerPickedAt instanceof Date
                ? promo.winnerPickedAt.toISOString()
                : new Date(promo.winnerPickedAt).toISOString())
            : null,
          createdAt: promo.createdAt instanceof Date
            ? promo.createdAt.toISOString()
            : new Date(promo.createdAt).toISOString(),
          participantCount: promo.participantCount,
        }))}
      />
    </div>
  );
}
