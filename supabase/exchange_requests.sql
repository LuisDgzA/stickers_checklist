-- Tabla de solicitudes de intercambio
CREATE TABLE public.exchange_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   UUID NOT NULL REFERENCES public.collections(id),
  requester_id    UUID NOT NULL,
  owner_id        UUID NOT NULL,
  requester_gives UUID[] NOT NULL DEFAULT '{}',
  owner_gives     UUID[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  share_token     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

-- Ambas partes pueden leer sus intercambios
CREATE POLICY "exchange_requests_select_parties" ON public.exchange_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- El solicitante puede crear
CREATE POLICY "exchange_requests_insert_requester" ON public.exchange_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- El dueño puede actualizar (aceptar/rechazar)
CREATE POLICY "exchange_requests_update_owner" ON public.exchange_requests
  FOR UPDATE USING (auth.uid() = owner_id);

-- El solicitante puede actualizar (cancelar)
CREATE POLICY "exchange_requests_update_requester" ON public.exchange_requests
  FOR UPDATE USING (auth.uid() = requester_id);

-- Habilitar realtime en la tabla para notificaciones instantáneas
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_requests;

-- Función RPC: ejecuta el intercambio de forma atómica (SECURITY DEFINER omite RLS en user_stickers)
CREATE OR REPLACE FUNCTION public.execute_exchange(p_exchange_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req exchange_requests%ROWTYPE;
  s_id UUID;
  v_qty INTEGER;
BEGIN
  SELECT * INTO req
  FROM exchange_requests
  WHERE id = p_exchange_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'intercambio no encontrado o ya procesado';
  END IF;

  IF auth.uid() != req.owner_id THEN
    RAISE EXCEPTION 'solo el dueño puede aceptar el intercambio';
  END IF;

  -- Validar que el dueño aún tiene repetidas (quantity >= 2) para cada estampa que daría
  FOREACH s_id IN ARRAY req.owner_gives LOOP
    SELECT quantity INTO v_qty
    FROM user_stickers
    WHERE user_id = req.owner_id AND sticker_id = s_id;

    IF v_qty IS NULL OR v_qty < 2 THEN
      RAISE EXCEPTION 'Ya no tienes suficientes repetidas para completar este intercambio. Alguna estampa ya fue intercambiada con otra persona.';
    END IF;
  END LOOP;

  -- Validar que el solicitante aún tiene repetidas para cada estampa que daría
  FOREACH s_id IN ARRAY req.requester_gives LOOP
    SELECT quantity INTO v_qty
    FROM user_stickers
    WHERE user_id = req.requester_id AND sticker_id = s_id;

    IF v_qty IS NULL OR v_qty < 2 THEN
      RAISE EXCEPTION 'La otra persona ya no tiene suficientes repetidas para completar este intercambio.';
    END IF;
  END LOOP;

  -- El dueño cede sus estampas al solicitante
  FOREACH s_id IN ARRAY req.owner_gives LOOP
    UPDATE user_stickers
    SET quantity = quantity - 1
    WHERE user_id = req.owner_id AND sticker_id = s_id;

    INSERT INTO user_stickers (user_id, collection_id, sticker_id, quantity)
    VALUES (req.requester_id, req.collection_id, s_id, 1)
    ON CONFLICT (user_id, sticker_id)
    DO UPDATE SET quantity = user_stickers.quantity + 1;
  END LOOP;

  -- El solicitante cede sus estampas al dueño
  FOREACH s_id IN ARRAY req.requester_gives LOOP
    UPDATE user_stickers
    SET quantity = quantity - 1
    WHERE user_id = req.requester_id AND sticker_id = s_id;

    INSERT INTO user_stickers (user_id, collection_id, sticker_id, quantity)
    VALUES (req.owner_id, req.collection_id, s_id, 1)
    ON CONFLICT (user_id, sticker_id)
    DO UPDATE SET quantity = user_stickers.quantity + 1;
  END LOOP;

  -- Marcar como aceptado
  UPDATE exchange_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_exchange_id;

  -- Auto-cancelar otros intercambios pendientes de ambas partes que quedaron inválidos:
  -- alguna estampa prometida ya no tiene la cantidad mínima de repetidas (quantity >= 2)
  UPDATE exchange_requests er
  SET status = 'cancelled', updated_at = now()
  WHERE er.id != p_exchange_id
    AND er.status = 'pending'
    AND (
      er.owner_id IN (req.owner_id, req.requester_id)
      OR er.requester_id IN (req.owner_id, req.requester_id)
    )
    AND (
      EXISTS (
        SELECT 1 FROM user_stickers us
        WHERE us.user_id = er.owner_id
          AND us.sticker_id = ANY(er.owner_gives)
          AND us.quantity < 2
      )
      OR EXISTS (
        SELECT 1 FROM user_stickers us
        WHERE us.user_id = er.requester_id
          AND us.sticker_id = ANY(er.requester_gives)
          AND us.quantity < 2
      )
    );
END;
$$;
