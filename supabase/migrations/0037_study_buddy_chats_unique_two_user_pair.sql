-- Two-user study_buddy_chats: prevent duplicate threads for the same pair (race on first message).
-- 1) Merge existing duplicates (same multiset of participants, order-independent).
-- 2) Canonical pair columns + trigger + partial unique index.
--    (PG does not allow subqueries inside CREATE INDEX expressions — prior revision failed.)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      pair_sig,
      MIN(id) AS keeper_id,
      array_agg(id ORDER BY id) AS ids
    FROM (
      SELECT
        id,
        (
          SELECT string_agg(elem::text, '|' ORDER BY elem::text)
          FROM jsonb_array_elements_text(c.participants) AS t(elem)
        ) AS pair_sig
      FROM study_buddy_chats c
      WHERE jsonb_array_length(c.participants) = 2
    ) x
    GROUP BY pair_sig
    HAVING COUNT(*) > 1
  LOOP
    UPDATE study_buddy_messages
    SET chat_id = r.keeper_id
    WHERE chat_id = ANY (r.ids)
      AND chat_id <> r.keeper_id;

    UPDATE message_unlocks
    SET chat_id = r.keeper_id
    WHERE chat_id = ANY (r.ids)
      AND chat_id <> r.keeper_id;

    DELETE FROM study_buddy_chats
    WHERE id = ANY (r.ids)
      AND id <> r.keeper_id;
  END LOOP;
END $$;

ALTER TABLE public.study_buddy_chats
  ADD COLUMN IF NOT EXISTS participant_sorted_a text,
  ADD COLUMN IF NOT EXISTS participant_sorted_b text;

UPDATE public.study_buddy_chats c
SET
  participant_sorted_a = sub.lo,
  participant_sorted_b = sub.hi
FROM (
  SELECT
    id,
    (SELECT min(x::text) FROM jsonb_array_elements_text(participants) AS t(x)) AS lo,
    (SELECT max(x::text) FROM jsonb_array_elements_text(participants) AS t(x)) AS hi
  FROM public.study_buddy_chats
  WHERE jsonb_array_length(participants) = 2
) sub
WHERE c.id = sub.id;

CREATE OR REPLACE FUNCTION public.study_buddy_chats_sync_sorted_pair()
RETURNS trigger
LANGUAGE plpgsql
AS $f$
BEGIN
  IF jsonb_array_length(NEW.participants) = 2 THEN
    SELECT min(x::text), max(x::text)
    INTO NEW.participant_sorted_a, NEW.participant_sorted_b
    FROM jsonb_array_elements_text(NEW.participants) AS t(x);
  ELSE
    NEW.participant_sorted_a := NULL;
    NEW.participant_sorted_b := NULL;
  END IF;
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS trg_study_buddy_chats_sorted_pair ON public.study_buddy_chats;
CREATE TRIGGER trg_study_buddy_chats_sorted_pair
  BEFORE INSERT OR UPDATE OF participants ON public.study_buddy_chats
  FOR EACH ROW
  EXECUTE PROCEDURE public.study_buddy_chats_sync_sorted_pair();

DROP INDEX IF EXISTS public.idx_study_buddy_chats_two_user_canonical_pair;

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_buddy_chats_two_user_canonical_pair
  ON public.study_buddy_chats (participant_sorted_a, participant_sorted_b)
  WHERE participant_sorted_a IS NOT NULL
    AND participant_sorted_b IS NOT NULL;
