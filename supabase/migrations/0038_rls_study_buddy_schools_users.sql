-- Row Level Security: study buddy + schools catalogue + users (KVKK: telefon/e-posta
-- tarayıcıdan doğrudan okunamaz). Sunucu Drizzle bağlantısı tablo sahibi olduğu için
-- RLS'yi atlar; yalnızca PostgREST (anon key + tarayıcı) bu kurallara tabidir.
--
-- Güvenli profil özeti: fetch_peer_profiles_for_study_buddy — yalnızca id, name, avatar, description.

CREATE OR REPLACE FUNCTION public.fetch_peer_profiles_for_study_buddy(requested_ids text[])
RETURNS TABLE(id text, name text, avatar text, description text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.name, u.avatar, u.description
  FROM unnest(requested_ids) AS rid(id)
  INNER JOIN public.users u ON u.id = rid.id
  WHERE
    u.id = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.study_buddy_chats c
      WHERE jsonb_array_length(c.participants) = 2
        AND c.participants @> jsonb_build_array((SELECT auth.uid()::text))
        AND c.participants @> jsonb_build_array(u.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.study_buddy_posts p WHERE p.user_id = u.id
    );
$$;

REVOKE ALL ON FUNCTION public.fetch_peer_profiles_for_study_buddy(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_peer_profiles_for_study_buddy(text[]) TO authenticated;

-- Şifre sıfırlama / doğrulama: tarayıcı anon iken users tablosuna doğrudan SELECT kapalı kalır.
CREATE OR REPLACE FUNCTION public.auth_lookup_provider_by_email(p_email text)
RETURNS TABLE(provider text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.provider
  FROM public.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.auth_lookup_provider_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_lookup_provider_by_email(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- study_buddy_chats
-- ---------------------------------------------------------------------------
ALTER TABLE public.study_buddy_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_buddy_chats_select_participant ON public.study_buddy_chats;
DROP POLICY IF EXISTS study_buddy_chats_insert_participant ON public.study_buddy_chats;
DROP POLICY IF EXISTS study_buddy_chats_update_participant ON public.study_buddy_chats;
DROP POLICY IF EXISTS study_buddy_chats_delete_participant ON public.study_buddy_chats;

CREATE POLICY study_buddy_chats_select_participant ON public.study_buddy_chats
  FOR SELECT TO authenticated
  USING (participants @> jsonb_build_array((SELECT auth.uid()::text)));

CREATE POLICY study_buddy_chats_insert_participant ON public.study_buddy_chats
  FOR INSERT TO authenticated
  WITH CHECK (participants @> jsonb_build_array((SELECT auth.uid()::text)));

CREATE POLICY study_buddy_chats_update_participant ON public.study_buddy_chats
  FOR UPDATE TO authenticated
  USING (participants @> jsonb_build_array((SELECT auth.uid()::text)))
  WITH CHECK (participants @> jsonb_build_array((SELECT auth.uid()::text)));

CREATE POLICY study_buddy_chats_delete_participant ON public.study_buddy_chats
  FOR DELETE TO authenticated
  USING (participants @> jsonb_build_array((SELECT auth.uid()::text)));

-- ---------------------------------------------------------------------------
-- study_buddy_messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.study_buddy_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_buddy_messages_select_participant ON public.study_buddy_messages;
DROP POLICY IF EXISTS study_buddy_messages_insert_participant ON public.study_buddy_messages;

CREATE POLICY study_buddy_messages_select_participant ON public.study_buddy_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_buddy_chats c
      WHERE c.id = study_buddy_messages.chat_id
        AND c.participants @> jsonb_build_array((SELECT auth.uid()::text))
    )
  );

CREATE POLICY study_buddy_messages_insert_participant ON public.study_buddy_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM public.study_buddy_chats c
      WHERE c.id = chat_id
        AND c.participants @> jsonb_build_array((SELECT auth.uid()::text))
    )
  );

-- ---------------------------------------------------------------------------
-- study_buddy_posts
-- ---------------------------------------------------------------------------
ALTER TABLE public.study_buddy_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_buddy_posts_select_auth ON public.study_buddy_posts;
DROP POLICY IF EXISTS study_buddy_posts_insert_own ON public.study_buddy_posts;
DROP POLICY IF EXISTS study_buddy_posts_update_own ON public.study_buddy_posts;
DROP POLICY IF EXISTS study_buddy_posts_delete_own ON public.study_buddy_posts;

CREATE POLICY study_buddy_posts_select_auth ON public.study_buddy_posts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY study_buddy_posts_insert_own ON public.study_buddy_posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY study_buddy_posts_update_own ON public.study_buddy_posts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY study_buddy_posts_delete_own ON public.study_buddy_posts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ---------------------------------------------------------------------------
-- schools (katalog — PII yok)
-- ---------------------------------------------------------------------------
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schools_select_public ON public.schools;

CREATE POLICY schools_select_public ON public.schools
  FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- users (doğrudan SELECT: yalnızca kendi satırı; akranlar RPC ile)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()::text));

CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()::text));

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()::text))
  WITH CHECK (id = (SELECT auth.uid()::text));
