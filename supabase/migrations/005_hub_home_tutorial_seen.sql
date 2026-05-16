ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hub_home_tutorial_seen BOOLEAN NOT NULL DEFAULT false;
