DROP POLICY IF EXISTS "user_stickers_select_for_exchange_parties" ON public.user_stickers;

CREATE POLICY "user_stickers_select_for_exchange_parties" ON public.user_stickers
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.exchange_requests er
      WHERE er.collection_id = user_stickers.collection_id
        AND (
          (er.owner_id = user_stickers.user_id AND er.requester_id = auth.uid())
          OR (er.requester_id = user_stickers.user_id AND er.owner_id = auth.uid())
        )
    )
  );
