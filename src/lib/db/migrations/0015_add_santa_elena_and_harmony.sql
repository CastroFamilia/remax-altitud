-- 1. Insert Community: Santa Elena Hills
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'santa-elena-hills',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'Santa Elena Hills',
  'Elevated Living, Endless Horizons.',
  'Vida Elevada, Horizontes Infinitos.',
  'Premium flat and elevated estate lots ranging from 1, 4, and 15 hectares. Ideal for privacy, luxury homesteads, or boutique development surrounded by nature.',
  'Lotes premium, planos y elevados, desde 1, 4 y 15 hectáreas. Ideales para proyectos privados, fincas de lujo o desarrollos boutique rodeados de naturaleza.',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  9.32, -83.62,
  '[[-83.625, 9.315], [-83.615, 9.315], [-83.615, 9.325], [-83.625, 9.325], [-83.625, 9.315]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.625 9.315, -83.615 9.315, -83.615 9.325, -83.625 9.325, -83.625 9.315))'),
  190000, 1200000,
  '{"elevation": "1,000m", "airportDistance": "3 hours to SJO", "internet": "Fiber optic", "amenities": ["Estate Lots (1 - 15 Hectares)", "Panoramic Mountain Views", "Blend of Flat & Ridged Terrain", "Luxury Homestead ready", "Boutique Development Potential", "Pristine Nature"], "developer": "Santa Elena Hills SA", "established": "2026"}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED.name,
  "tagline_en" = EXCLUDED.tagline_en,
  "tagline_es" = EXCLUDED.tagline_es,
  "description_en" = EXCLUDED.description_en,
  "description_es" = EXCLUDED.description_es,
  "hero_image_url" = EXCLUDED.hero_image_url,
  "latitude" = EXCLUDED.latitude,
  "longitude" = EXCLUDED.longitude,
  "geo_fence_coords" = EXCLUDED.geo_fence_coords,
  "geo_fence" = EXCLUDED.geo_fence,
  "price_min_usd" = EXCLUDED.price_min_usd,
  "price_max_usd" = EXCLUDED.price_max_usd,
  "quick_facts" = EXCLUDED.quick_facts;

--> statement-breakpoint

-- 2. Insert Community: Harmony Heights
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'harmony-heights',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'Harmony Heights',
  'Your Canvas for Peace and Purpose.',
  'El Lienzo Perfecto para una Vida en Armonía.',
  'Ready-to-build, beautifully flat lots designed for effortless construction. Nestled in a peaceful community with ideal weather.',
  'Lotes completamente planos y listos para construir. Ubicados en una comunidad pacífica con un clima ideal.',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  9.33, -83.63,
  '[[-83.635, 9.325], [-83.625, 9.325], [-83.625, 9.335], [-83.635, 9.335], [-83.635, 9.325]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.635 9.325, -83.625 9.325, -83.625 9.335, -83.635 9.335, -83.635 9.325))'),
  65000, 80000,
  '{"elevation": "1,000m", "airportDistance": "3 hours to SJO", "internet": "Fiber optic", "amenities": ["100% Usable Terrain", "Flat Topography", "Ready to Build Lots", "Ideal Climate (20°C - 28°C)", "Peaceful Community", "Effortless Construction"], "developer": "Harmony Dev Group", "established": "2026"}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED.name,
  "tagline_en" = EXCLUDED.tagline_en,
  "tagline_es" = EXCLUDED.tagline_es,
  "description_en" = EXCLUDED.description_en,
  "description_es" = EXCLUDED.description_es,
  "hero_image_url" = EXCLUDED.hero_image_url,
  "latitude" = EXCLUDED.latitude,
  "longitude" = EXCLUDED.longitude,
  "geo_fence_coords" = EXCLUDED.geo_fence_coords,
  "geo_fence" = EXCLUDED.geo_fence,
  "price_min_usd" = EXCLUDED.price_min_usd,
  "price_max_usd" = EXCLUDED.price_max_usd,
  "quick_facts" = EXCLUDED.quick_facts;
