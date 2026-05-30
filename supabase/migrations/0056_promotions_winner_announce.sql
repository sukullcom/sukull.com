-- 0056: Promotions — winner announcement flag
--
-- Adds `winner_announced` so a picked winner stays visible on the learn
-- dashboard banner (to all users) even after the campaign's time window
-- closes, until an admin explicitly hides it again. Picking a winner sets
-- this to true; clearing the winner resets it to false. Admins can also
-- toggle visibility without re-drawing.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS winner_announced BOOLEAN NOT NULL DEFAULT false;

-- Surfaces the "winner showcase" rows (announced + winner set) regardless of
-- the active/time-window predicate so the banner read can OR them in cheaply.
CREATE INDEX IF NOT EXISTS promotions_winner_announced_idx
  ON public.promotions (winner_announced)
  WHERE winner_announced = true;
