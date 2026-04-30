# Teacher review system

One-time **student → teacher** ratings after a **kabul edilmiş ilan teklifi** (`listing_offers.status = 'accepted'`) or after **karşılıklı mesajlaşma** in the private-lesson chat (`study_buddy_messages`): son mesaj **30 gün** içinde olmalı ve **öğrenci ile eğitmenin her birinden en az 2 mesaj** bulunmalı (`REVIEW_MESSAGE_MIN_PER_SIDE`, `REVIEW_MESSAGE_RECENCY_DAYS` in `lib/review-guard.ts` → `db/queries/teacher-reviews.ts`).

## API (authenticated)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/teachers/{teacherId}/can-review` | Whether the current user may submit a review; includes `suggestedOfferId` when an accepted offer exists. |
| `POST` | `/api/teachers/{teacherId}/review` | Create review. Body: `{ rating: 1–10, comment?: string, offerId?: number }`. Requires **CSRF** (`GET /api/csrf` + `x-csrf-token`) and trusted **Origin** (same rules as other mutating APIs). |
| `GET` | `/api/teachers/{teacherId}/reviews?cursor=&limit=` | Paginated reviews + `averageRating` / `reviewCount`. |

- **409** if a row already exists for `(student_id, teacher_id)` (unique constraint).
- **403** if eligibility fails (wrong offer, no two-way recent messages when `offerId` omitted, etc.).
- **Daily rate limit**: Postgres-backed key `teacherReviewDaily:user:{id}:teacher:{teacherId}` (`RATE_LIMITS.teacherReviewDaily`).

## Caching (no Redis)

Aggregate **average** and **count** are cached with Next `unstable_cache` (~60s TTL, tag `teacher-reviews:{teacherId}`). On successful `POST` review, routes call `revalidateTag` for that tag plus `teachers` and `teacher-stats:{teacherId}`.

## Database

Migration: `supabase/migrations/0034_teacher_reviews.sql`.  
Drizzle: `teacherReviews` in `db/schema.ts`.

## UI

- Eğitmen profili: `TeacherReviewsSection` + `TeacherReviewModal` (`components/`).
- Mesaj thread: link to profile with `?review=1` when `can-review` would be true.

## E2E

Playwright is not in this repo’s default `package.json`; add a devDependency and a spec under `e2e/` if you want browser-level coverage of the accept-offer → review flow.
