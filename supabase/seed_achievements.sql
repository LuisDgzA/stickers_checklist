INSERT INTO public.achievements (code, name, description, icon, sort_order)
VALUES
  ('first_sticker', 'Primer sticker', 'Marcaste tu primera estampa.', 'sparkles', 10),
  ('album_5_percent', 'Ya empezó la colección', 'Completaste el 5% del álbum.', 'progress-5', 20),
  ('album_25_percent', 'Coleccionista constante', 'Completaste el 25% del álbum.', 'progress-25', 30),
  ('album_50_percent', 'Medio álbum listo', 'Completaste la mitad del álbum.', 'progress-50', 40),
  ('album_75_percent', 'Casi completo', 'Completaste el 75% del álbum.', 'progress-75', 50),
  ('album_complete', 'Álbum completo', 'Completaste todas las estampas del álbum.', 'trophy', 60),
  ('last_sticker', 'Último sticker', 'Conseguiste la estampa que faltaba para cerrar el álbum.', 'flag', 70),
  ('first_team_completed', 'Primer equipo completado', 'Completaste tu primer país o equipo.', 'shield', 80),
  ('first_group_completed', 'Primer grupo completado', 'Completaste todos los países de un grupo.', 'grid', 90),
  ('first_duplicate', 'Primer repetido', 'Registraste tu primer sticker repetido.', 'copy', 100),
  ('market_open', 'Mercado abierto', 'Ya tienes repetidas para intercambiar.', 'swap', 110)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
