CREATE OR REPLACE FUNCTION public.get_user_display_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(trim(full_name), ''), NULLIF(trim(nickname), ''))
  FROM public.profiles
  WHERE id = p_user_id;
$$;
