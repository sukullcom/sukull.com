-- Admin’in eklediği hizmetler. Sabit katalogdaki slug’lar burada tutulmaz.
CREATE TABLE IF NOT EXISTS public.custom_marketplace_services (
  slug text PRIMARY KEY,
  name text NOT NULL,
  category_slug text NOT NULL,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  variant boolean NOT NULL DEFAULT false,
  anywhere boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
