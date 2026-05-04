DO $$
DECLARE
  col_id UUID;
  sec_fwc_id UUID;
  sec_coca_id UUID;
  grp_a UUID; grp_b UUID; grp_c UUID; grp_d UUID;
  grp_e UUID; grp_f UUID; grp_g UUID; grp_h UUID;
  grp_i UUID; grp_j UUID; grp_k UUID; grp_l UUID;
  sec_extra_id UUID;
  c_id UUID;
  country_rec RECORD;
  player_rec RECORD;
  rarity_rec RECORD;
  sticker_num INTEGER;
BEGIN
  -- Collection
  INSERT INTO public.collections (name, slug, description, is_active)
  VALUES ('Mundial 2026', 'mundial-2026', 'Álbum oficial del Mundial de Fútbol 2026', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO col_id;

  -- Sections
  INSERT INTO public.sections (collection_id, name, slug, type, sort_order)
  VALUES (col_id, 'FWC Especiales', 'fwc', 'special', 0)
  ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order
  RETURNING id INTO sec_fwc_id;

  INSERT INTO public.sections (collection_id, name, slug, type, sort_order)
  VALUES (col_id, 'Coca Cola', 'coca-cola', 'special', 13)
  ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order
  RETURNING id INTO sec_coca_id;

  INSERT INTO public.sections (collection_id, name, slug, type, sort_order)
  VALUES (col_id, 'Extra Stickers', 'extra-stickers', 'extra', 14)
  ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order
  RETURNING id INTO sec_extra_id;

  -- Groups
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo A', 'grupo-a',  1) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_a;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo B', 'grupo-b',  2) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_b;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo C', 'grupo-c',  3) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_c;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo D', 'grupo-d',  4) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_d;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo E', 'grupo-e',  5) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_e;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo F', 'grupo-f',  6) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_f;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo G', 'grupo-g',  7) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_g;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo H', 'grupo-h',  8) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_h;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo I', 'grupo-i',  9) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_i;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo J', 'grupo-j', 10) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_j;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo K', 'grupo-k', 11) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_k;
  INSERT INTO public.groups (collection_id, name, slug, sort_order) VALUES (col_id, 'Grupo L', 'grupo-l', 12) ON CONFLICT (collection_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO grp_l;

  -- Eliminar selecciones que ya no pertenecen al álbum
  DELETE FROM public.stickers
  WHERE collection_id = col_id
    AND country_id IN (
      SELECT id FROM public.countries
      WHERE collection_id = col_id
        AND code IN ('CHI','PER','WAL','ITA','SVN','BOL','VEN','NGA','CMR')
    );
  DELETE FROM public.countries
  WHERE collection_id = col_id
    AND code IN ('CHI','PER','WAL','ITA','SVN','BOL','VEN','NGA','CMR');

  -- Temp table para selecciones
  CREATE TEMP TABLE _seed_countries (
    c_name TEXT, c_code TEXT, c_slug TEXT, c_group_id UUID, c_sort INTEGER
  ) ON COMMIT DROP;

  INSERT INTO _seed_countries VALUES
    -- Grupo A
    ('México',              'MEX', 'mexico',              grp_a,  1),
    ('Sudáfrica',           'RSA', 'sudafrica',           grp_a,  2),
    ('Corea del Sur',       'KOR', 'corea-del-sur',       grp_a,  3),
    ('República Checa',     'CZE', 'republica-checa',     grp_a,  4),
    -- Grupo B
    ('Canadá',              'CAN', 'canada',              grp_b,  5),
    ('Bosnia-Herzegovina',  'BIH', 'bosnia-herzegovina',  grp_b,  6),
    ('Qatar',               'QAT', 'qatar',               grp_b,  7),
    ('Suiza',               'SUI', 'suiza',               grp_b,  8),
    -- Grupo C
    ('Brasil',              'BRA', 'brasil',              grp_c,  9),
    ('Marruecos',           'MAR', 'marruecos',           grp_c, 10),
    ('Haití',               'HAI', 'haiti',               grp_c, 11),
    ('Escocia',             'SCO', 'escocia',             grp_c, 12),
    -- Grupo D
    ('Estados Unidos',      'USA', 'estados-unidos',      grp_d, 13),
    ('Paraguay',            'PAR', 'paraguay',            grp_d, 14),
    ('Australia',           'AUS', 'australia',           grp_d, 15),
    ('Turquía',             'TUR', 'turquia',             grp_d, 16),
    -- Grupo E
    ('Alemania',            'GER', 'alemania',            grp_e, 17),
    ('Curazao',             'CUW', 'curazao',             grp_e, 18),
    ('Costa de Marfil',     'CIV', 'costa-de-marfil',    grp_e, 19),
    ('Ecuador',             'ECU', 'ecuador',             grp_e, 20),
    -- Grupo F
    ('Países Bajos',        'NED', 'paises-bajos',        grp_f, 21),
    ('Japón',               'JPN', 'japon',               grp_f, 22),
    ('Suecia',              'SWE', 'suecia',              grp_f, 23),
    ('Túnez',               'TUN', 'tunez',               grp_f, 24),
    -- Grupo G
    ('Bélgica',             'BEL', 'belgica',             grp_g, 25),
    ('Egipto',              'EGY', 'egipto',              grp_g, 26),
    ('Irán',                'IRN', 'iran',                grp_g, 27),
    ('Nueva Zelanda',       'NZL', 'nueva-zelanda',       grp_g, 28),
    -- Grupo H
    ('España',              'ESP', 'espana',              grp_h, 29),
    ('Cabo Verde',          'CPV', 'cabo-verde',          grp_h, 30),
    ('Arabia Saudita',      'KSA', 'arabia-saudita',      grp_h, 31),
    ('Uruguay',             'URU', 'uruguay',             grp_h, 32),
    -- Grupo I
    ('Francia',             'FRA', 'francia',             grp_i, 33),
    ('Senegal',             'SEN', 'senegal',             grp_i, 34),
    ('Irak',                'IRQ', 'irak',                grp_i, 35),
    ('Noruega',             'NOR', 'noruega',             grp_i, 36),
    -- Grupo J
    ('Argentina',           'ARG', 'argentina',           grp_j, 37),
    ('Argelia',             'ALG', 'argelia',             grp_j, 38),
    ('Austria',             'AUT', 'austria',             grp_j, 39),
    ('Jordania',            'JOR', 'jordania',            grp_j, 40),
    -- Grupo K
    ('Portugal',            'POR', 'portugal',            grp_k, 41),
    ('Congo RD',            'COD', 'congo-rd',            grp_k, 42),
    ('Uzbekistán',          'UZB', 'uzbekistan',          grp_k, 43),
    ('Colombia',            'COL', 'colombia',            grp_k, 44),
    -- Grupo L
    ('Inglaterra',          'ENG', 'inglaterra',          grp_l, 45),
    ('Croacia',             'CRO', 'croacia',             grp_l, 46),
    ('Ghana',               'GHA', 'ghana',               grp_l, 47),
    ('Panamá',              'PAN', 'panama',              grp_l, 48);

  -- Insertar selecciones y sus stickers (20 por selección)
  FOR country_rec IN SELECT * FROM _seed_countries ORDER BY c_sort LOOP

    INSERT INTO public.countries (collection_id, group_id, name, code, slug, sort_order)
    VALUES (col_id, country_rec.c_group_id, country_rec.c_name, country_rec.c_code, country_rec.c_slug, country_rec.c_sort)
    ON CONFLICT (collection_id, code) DO UPDATE
      SET name = EXCLUDED.name, group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order
    RETURNING id INTO c_id;

    FOR sticker_num IN 1..20 LOOP
      INSERT INTO public.stickers (collection_id, country_id, code, number, sort_order)
      VALUES (
        col_id,
        c_id,
        country_rec.c_code || '-' || LPAD(sticker_num::TEXT, 2, '0'),
        sticker_num,
        (country_rec.c_sort - 1) * 20 + sticker_num
      )
      ON CONFLICT (collection_id, code) DO UPDATE SET sort_order = EXCLUDED.sort_order;
    END LOOP;

  END LOOP;

  -- Eliminar FWC-20 si quedó del seed anterior (el rango correcto es FWC-00 a FWC-19)
  DELETE FROM public.stickers WHERE collection_id = col_id AND code = 'FWC-20';

  -- FWC stickers especiales: FWC-00 hasta FWC-19 (offset 960 = 48 selecciones × 20)
  FOR sticker_num IN 0..19 LOOP
    INSERT INTO public.stickers (collection_id, section_id, code, number, name, sort_order)
    VALUES (
      col_id,
      sec_fwc_id,
      'FWC-' || LPAD(sticker_num::TEXT, 2, '0'),
      sticker_num,
      'FWC Especial ' || sticker_num,
      960 + sticker_num
    )
    ON CONFLICT (collection_id, code) DO UPDATE SET sort_order = EXCLUDED.sort_order;
  END LOOP;

  -- Coca Cola stickers (offset 980 = 960 + 20 FWC)
  FOR sticker_num IN 1..14 LOOP
    INSERT INTO public.stickers (collection_id, section_id, code, number, name, sort_order)
    VALUES (
      col_id,
      sec_coca_id,
      'CC-' || LPAD(sticker_num::TEXT, 2, '0'),
      sticker_num,
      'Coca Cola ' || sticker_num,
      980 + sticker_num
    )
    ON CONFLICT (collection_id, code) DO NOTHING;
  END LOOP;

  -- Extra Stickers: 20 jugadores × 4 raridades (REG, BRO, SIL, ORO)
  -- Nombre formato: "Player Name|CODIGO_FIFA"
  CREATE TEMP TABLE _seed_extra_players (p_name TEXT, p_num INTEGER) ON COMMIT DROP;
  INSERT INTO _seed_extra_players VALUES
    ('Lionel Messi|ARG',         1),
    ('Jeremy Doku|BEL',          2),
    ('Vinicius Junior|BRA',      3),
    ('Alphonso Davies|CAN',      4),
    ('Luis Díaz|COL',            5),
    ('Luka Modrić|CRO',          6),
    ('Moisés Caicedo|ECU',       7),
    ('Mohamed Salah|EGY',        8),
    ('Jude Bellingham|ENG',      9),
    ('Kylian Mbappé|FRA',       10),
    ('Florian Wirtz|GER',       11),
    ('Heung-min Son|KOR',       12),
    ('Raúl Jiménez|MEX',        13),
    ('Achraf Hakimi|MAR',       14),
    ('Cody Gakpo|NED',          15),
    ('Erling Haaland|NOR',      16),
    ('Cristiano Ronaldo|POR',   17),
    ('Lamine Yamal|ESP',        18),
    ('Federico Valverde|URU',   19),
    ('Christian Pulisic|USA',   20);

  CREATE TEMP TABLE _seed_rarities (r_code TEXT, r_idx INTEGER) ON COMMIT DROP;
  INSERT INTO _seed_rarities VALUES ('REG', 0), ('BRO', 1), ('SIL', 2), ('ORO', 3);

  FOR player_rec IN SELECT * FROM _seed_extra_players ORDER BY p_num LOOP
    FOR rarity_rec IN SELECT * FROM _seed_rarities ORDER BY r_idx LOOP
      INSERT INTO public.stickers (collection_id, section_id, code, number, name, sort_order)
      VALUES (
        col_id,
        sec_extra_id,
        'ES-' || LPAD(player_rec.p_num::TEXT, 2, '0') || '-' || rarity_rec.r_code,
        rarity_rec.r_idx + 1,
        player_rec.p_name,
        1000 + (player_rec.p_num - 1) * 4 + rarity_rec.r_idx
      )
      ON CONFLICT (collection_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
    END LOOP;
  END LOOP;

END $$;
