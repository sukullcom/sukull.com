CREATE TABLE IF NOT EXISTS "user_daily_challenges" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "date" text NOT NULL,
  "challenge_day" integer NOT NULL,
  "progress" integer NOT NULL DEFAULT 0,
  "target" integer NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "reward_claimed" boolean NOT NULL DEFAULT false,
  "bonus_points" integer NOT NULL DEFAULT 0,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_daily_challenges_user_date_idx" ON "user_daily_challenges" ("user_id", "date");
