INSERT INTO public.achievements (code, title, description, category, sort_order)
VALUES ('special_complete', 'Colección élite', 'Conseguiste todas las estampas especiales.', 'star', 120)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;
