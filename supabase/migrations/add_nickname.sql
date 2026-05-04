-- Add nickname to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique
  ON public.profiles (lower(nickname));

-- RPC: check availability (public, no auth required)
CREATE OR REPLACE FUNCTION public.check_nickname_available(p_nickname TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(nickname) = lower(p_nickname)
  );
$$;

-- RPC: get nickname by user_id (for share page, no auth required)
CREATE OR REPLACE FUNCTION public.get_user_nickname(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nickname FROM public.profiles WHERE id = p_user_id;
$$;
