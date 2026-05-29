-- Update and seed the definitive Villas San Miguel community development
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'villas-san-miguel',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'Villas San Miguel',
  'Serenity, Spectacular Views, and Beautiful Mountain Landscapes.',
  'Tranquilidad, Vistas Espectaculares y Hermosos Paisajes.',
  'Located in the beautiful area of San Miguel de Páramo, just 15 minutes from the center of Pérez Zeledón. Villas San Miguel is an exclusive development highlighted by its unmatched tranquility and majestic mountain landscapes. It features large, spacious lots ranging from 1,300 to 1,800 m², perfect for modern constructions and generous green areas. Enjoy a climate that is both warm and refreshing, blessed with constant breezes and incredible panoramic views.',
  'Ubicado en la hermosa zona de San Miguel de Páramo, a tan solo 15 minutos del centro de Pérez Zeledón. Villas San Miguel es un proyecto exclusivo que destaca por su inigualable tranquilidad y majestuosos paisajes montañosos. Ofrece lotes grandes y espaciosos, desde 1,300 hasta 1,800 m², ideales para construcciones modernas y amplias zonas verdes. Disfrute de un clima muy cálido y fresco a la vez, donde corre mucha brisa y se aprecian vistas panorámicas increíbles.',
  '/images/areas/villas-san-miguel-hero.jpg',
  9.4447, -83.7431,
  '[[-83.748, 9.440], [-83.738, 9.440], [-83.738, 9.450], [-83.748, 9.450], [-83.748, 9.440]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.748 9.440, -83.738 9.440, -83.738 9.450, -83.748 9.450, -83.748 9.440))'),
  94000, 135000,
  '{"elevation": "850m", "airportDistance": "3 hours to SJO", "internet": "Fiber optic / Fibra óptica", "amenities": ["Escuela / School (500m)", "Abastecedor / Store (800m)", "Pérez Zeledón (15 min)", "Lotes / Lots (1,300 - 1,800 m²)", "Vistas Increíbles / Incredible Views", "Tranquilidad / Tranquility"], "developer": "Desarrollo Inmobiliario Villas San Miguel", "established": "2026"}'::jsonb
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
