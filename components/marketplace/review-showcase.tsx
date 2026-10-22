import { Stars } from "@/components/marketplace/rating-badge";
import type { ShowcaseReview } from "@/lib/marketplace/showcase";

export function ReviewShowcase({ reviews }: { reviews: ShowcaseReview[] }) {
  return (
    <section aria-labelledby="yorumlar-baslik">
      <h2 id="yorumlar-baslik" className="mb-3 text-lg font-extrabold">
        Hizmet alanlar ne diyor?
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {reviews.map((review, index) => (
          <li key={`${index}-${review.name}`} className="mk-card flex flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-suk-brand-soft px-2.5 py-0.5 text-xs font-bold text-suk-brand">
                {review.service}
              </span>
              <Stars value={review.rating} />
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">“{review.text}”</p>
            <p className="mt-3 text-sm font-bold">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.place}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
