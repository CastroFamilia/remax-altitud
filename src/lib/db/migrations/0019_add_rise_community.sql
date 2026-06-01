-- Seed the definitive RISE Costa Rica community development
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "site_map_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", 
  "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'rise-costa-rica',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'RISE Costa Rica',
  'Family-focused community',
  'Comunidad enfocada en familias',
  'RISE Costa Rica is an intentional residential community for families and entrepreneurs seeking a lifestyle built on creativity, nature, and genuine connection. Situated on 200 hectares in Pérez Zeledón—just 15 minutes from San Isidro de El General and all its conveniences—the project is a dynamic ecosystem integrating five core pillars: Residential Community, Waldorf-Inspired School, Private Airstrip, Commercial Space & Coworking, and Kinkára. Located near Chirripó National Park at approximately 1,000 meters above sea level, RISE enjoys a spring-like climate year-round.',
  'RISE Costa Rica es una comunidad residencial intencional para familias y emprendedores que buscan un estilo de vida basado en la creatividad, la naturaleza y la conexión genuina. Situado sobre 200 hectáreas en Pérez Zeledón —a solo 15 minutos de San Isidro de El General y de todos sus servicios (hospitales, cines y centros comerciales)— el proyecto es un ecosistema dinámico que integra cinco pilares fundamentales: Comunidad Residencial, Escuela Inspirada en Waldorf, Pista de Aterrizaje Privada, Espacio Comercial y Coworking, y Kinkára. Ubicado cerca del Parque Nacional Chirripó, a unos 1,000 metros sobre el nivel del mar, RISE goza de un clima primaveral durante todo el año.',
  '/images/community-rise.png',
  'https://risecostarica.com/wp-content/uploads/2025/11/Etapa-2-ful-scaled.jpg',
  9.365638078013543, -83.62172331237561,
  '[[-83.625, 9.362], [-83.618, 9.362], [-83.618, 9.369], [-83.625, 9.369], [-83.625, 9.362]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.625 9.362, -83.618 9.362, -83.618 9.369, -83.625 9.369, -83.625 9.362))'),
  150000, 500000,
  '{"elevation": "1,000 meters (3,280 feet) / 1.000 metros (3.280 pies)", "airportDistance": "Airstrip on site, 20 mins to PZ Airport, 3 hours to SJO", "internet": "Fiber Optic / Fibra óptica", "developer": "David Comfort / New Earth Preservation S.A.", "established": "2022 (Note: Only selling to full-time families, no investors)", "amenities": ["Clubhouse", "Salt Pool / Piscina de sal", "Kinkára Retreat Center / Centro de Retiros Kinkára", "Waldorf-Inspired School / Escuela inspirada en Waldorf", "Private Airstrip / Pista de aterrizaje privada", "Commercial Areas / Áreas comerciales", "River with water holes / Río con pozas y cataratas", "Biking & Hiking Trails / Senderos para ciclismo y caminatas"]}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "area_id" = EXCLUDED.area_id,
  "name" = EXCLUDED.name,
  "tagline_en" = EXCLUDED.tagline_en,
  "tagline_es" = EXCLUDED.tagline_es,
  "description_en" = EXCLUDED.description_en,
  "description_es" = EXCLUDED.description_es,
  "hero_image_url" = EXCLUDED.hero_image_url,
  "site_map_image_url" = EXCLUDED.site_map_image_url,
  "latitude" = EXCLUDED.latitude,
  "longitude" = EXCLUDED.longitude,
  "geo_fence_coords" = EXCLUDED.geo_fence_coords,
  "geo_fence" = EXCLUDED.geo_fence,
  "price_min_usd" = EXCLUDED.price_min_usd,
  "price_max_usd" = EXCLUDED.price_max_usd,
  "quick_facts" = EXCLUDED.quick_facts;