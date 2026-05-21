-- Çoklu rol: users.roles[] — user + student + teacher + admin birlikte olabilir.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT ARRAY['user', 'student']::text[];

UPDATE public.users SET roles = ARRAY['user', 'student']::text[];

UPDATE public.users
SET roles = roles || ARRAY['teacher']::text[]
WHERE role::text = 'teacher' AND NOT ('teacher' = ANY (roles));

UPDATE public.users
SET roles = roles || ARRAY['admin']::text[]
WHERE role::text = 'admin' AND NOT ('admin' = ANY (roles));

UPDATE public.users u
SET roles = roles || ARRAY['teacher']::text[]
WHERE EXISTS (
  SELECT 1 FROM public.teacher_applications ta
  WHERE ta.user_id = u.id AND ta.status = 'approved'
)
AND NOT ('teacher' = ANY (u.roles));

UPDATE public.users
SET role = CASE
  WHEN 'admin' = ANY (roles) THEN 'admin'::role
  WHEN 'teacher' = ANY (roles) THEN 'teacher'::role
  WHEN 'student' = ANY (roles) THEN 'student'::role
  ELSE 'user'::role
END;

CREATE INDEX IF NOT EXISTS idx_users_roles_gin ON public.users USING gin (roles);
