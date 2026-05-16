DO $$
DECLARE
  col_id UUID;
  sec_id UUID;
  sticker_num INTEGER;
BEGIN
  INSERT INTO public.collections (name, slug, description, is_active, emojis)
  VALUES ('2026 Prizm Mundial Monopoly', 'prizm-monopoly-2026', 'Colección Prizm Mundial Monopoly 2026', true, '⚽💎')
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    emojis = EXCLUDED.emojis
  RETURNING id INTO col_id;

  INSERT INTO public.sections (collection_id, name, slug, type, sort_order)
  VALUES (col_id, 'Monopoly', 'monopoly', 'special', 0)
  ON CONFLICT (collection_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO sec_id;

  FOR sticker_num IN 1..100 LOOP
    INSERT INTO public.stickers (collection_id, section_id, code, number, name, sort_order)
    VALUES (
      col_id,
      sec_id,
      LPAD(sticker_num::TEXT, 2, '0'),
      sticker_num,
      NULL,
      sticker_num - 1
    )
    ON CONFLICT (collection_id, code) DO UPDATE SET
      section_id = EXCLUDED.section_id,
      number = EXCLUDED.number,
      name = EXCLUDED.name,
      sort_order = EXCLUDED.sort_order;
  END LOOP;
END $$;
