import type { Metadata } from "next";

import { Subpage } from "@/components/marketplace/subpage";
import { listProviderReviews } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import { publicCustomerName } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Müşteri yorumları" };

export default async function ReviewsPage() {
  const account = await requireMarketAccount("/ayarlar/yorumlar");
  const reviews = await listProviderReviews(account.id);
  return (
    <Subpage title="Müşteri yorumları" backHref="/ayarlar">
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Teklifin kabul edildikten sonra müşteriler yıldız ve yorum bırakabilir.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="mk-card p-4">
              <p className="font-bold">
                {publicCustomerName(review.firstName ?? "", review.lastName ?? "", review.username)} · {review.stars}/5
              </p>
              <p className="text-sm text-muted-foreground">{getService(review.serviceSlug)?.name}</p>
              {review.body && <p className="mt-2 text-sm">{review.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </Subpage>
  );
}
