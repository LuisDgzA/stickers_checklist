-- When a user confirms their email, copy nickname from user_metadata into profiles.
-- This is the reliable fallback in case the /auth/callback upsert fails.
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when email_confirmed_at transitions from NULL to a value
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET
      nickname    = COALESCE(nickname, NEW.raw_user_meta_data->>'nickname'),
      email       = COALESCE(email, NEW.email),
      updated_at  = NOW()
    WHERE id = NEW.id
      AND nickname IS NULL
      AND NEW.raw_user_meta_data->>'nickname' IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();
