-- Elimina logros que no aplican a la coleccion Prizm Monopoly 2026.
-- Seguro de ejecutar varias veces.

DELETE FROM public.user_achievements
WHERE collection_id = (
  SELECT id
  FROM public.collections
  WHERE slug = 'prizm-monopoly-2026'
)
AND achievement_code IN ('first_team_completed', 'first_group_completed');
