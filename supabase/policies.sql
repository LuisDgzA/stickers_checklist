-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- profiles: each user reads/edits only their own profile
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- collections: public read
CREATE POLICY "collections_public_read" ON public.collections FOR SELECT USING (is_active = true);

-- sections: public read
CREATE POLICY "sections_public_read" ON public.sections FOR SELECT USING (true);

-- groups: public read
CREATE POLICY "groups_public_read" ON public.groups FOR SELECT USING (true);

-- countries: public read
CREATE POLICY "countries_public_read" ON public.countries FOR SELECT USING (true);

-- stickers: public read
CREATE POLICY "stickers_public_read" ON public.stickers FOR SELECT USING (true);

-- user_stickers: own only
CREATE POLICY "user_stickers_select_own" ON public.user_stickers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stickers_insert_own" ON public.user_stickers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_stickers_update_own" ON public.user_stickers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_stickers_delete_own" ON public.user_stickers FOR DELETE USING (auth.uid() = user_id);

-- user_stickers: allow reading other user's stickers for match (via share_links)
CREATE POLICY "user_stickers_select_for_match" ON public.user_stickers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.share_links sl
      WHERE sl.user_id = user_stickers.user_id
        AND sl.collection_id = user_stickers.collection_id
        AND sl.is_active = true
    )
  );

-- share_links: own management
CREATE POLICY "share_links_select_own" ON public.share_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "share_links_insert_own" ON public.share_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "share_links_update_own" ON public.share_links FOR UPDATE USING (auth.uid() = user_id);

-- share_links: public read by active token (for match page)
CREATE POLICY "share_links_select_by_token" ON public.share_links
  FOR SELECT USING (is_active = true);
