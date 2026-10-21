-- Hizmet verenin bir hizmet içinde seçtiği çeşitler, ör. {"variants": ["Matematik"]}.
-- Boş nesne: o hizmetin tüm talepleri.
ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS filters jsonb NOT NULL DEFAULT '{}'::jsonb;
