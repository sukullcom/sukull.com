import { getActivePromotionsForCurrentUser } from "@/lib/promotions";
import { PromotionBanner } from "./promotion-banner";

/**
 * Server component that fetches every live promotion for the current user
 * and renders one banner per row. Lives above DailyProgress/DailyChallenge
 * on the protected layout so a campaign is the first thing students see
 * when they land on the learn dashboard.
 *
 * No-op when there is nothing live — returns `null` so the layout collapses
 * naturally and we don't introduce empty whitespace.
 */
export async function ActivePromotionBanners() {
  let promotions: Awaited<ReturnType<typeof getActivePromotionsForCurrentUser>>;
  try {
    promotions = await getActivePromotionsForCurrentUser();
  } catch {
    // Banner failure must never bubble up to crash the layout. Worst case
    // a campaign is invisible for a request; the next visit retries.
    return null;
  }

  if (!promotions.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {promotions.map((promo) => (
        <PromotionBanner key={promo.id} promotion={promo} />
      ))}
    </div>
  );
}
