-- 1. Insert Area: san-mateo
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'san-mateo', 
  'San Mateo', 
  'San Mateo', 
  'Mountain',
  'A lush, sun-drenched valley bordering the Machuca River, San Mateo provides perfect weather, profound peace, and rapid access to both the central valley and Pacific beaches. Famous for high-end conscious living communities, pristine nature, and premium connectivity.',
  'Un valle exuberante y soleado que bordea el río Machuca, San Mateo ofrece un clima perfecto, paz profunda y rápido acceso tanto al valle central como a las playas del Pacífico. Famoso por sus comunidades de vida consciente, naturaleza virgen y conectividad de primer nivel.',
  'https://images.unsplash.com/photo-1590494424361-9f93dc4ebbf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 
  'Alajuela', 'San Mateo', 'San Mateo', 9.9482, -84.5298, 6,
  '{"elevation": "250m", "climate": "Warm tropical (24°C - 34°C)", "nearestAirport": "San José (SJO) — 1 hour", "nearestHospital": "Hospital de Alajuela — 45 min", "nearestBeach": "Jacó Beach — 40 min", "investmentContext": {"appreciationTrend": "8-10% annual appreciation", "rentalYieldEstimate": "6-8% for custom eco-homes", "marketHighlights": ["Conscious living hub (La Ecovilla, Alegría Village)", "No HOA restrictions at Serena", "Route 27 top connectivity"]}}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "name_en" = EXCLUDED.name_en,
  "name_es" = EXCLUDED.name_es,
  "region" = EXCLUDED.region,
  "description_en" = EXCLUDED.description_en,
  "description_es" = EXCLUDED.description_es,
  "sort_order" = EXCLUDED.sort_order,
  "metadata" = EXCLUDED.metadata;

--> statement-breakpoint

-- 2. Insert Community: RISE Costa Rica
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'rise-costa-rica',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'RISE Costa Rica',
  'The Life You Actually Want.',
  'La vida que realmente quieres.',
  'RISE is a curated residential community for purpose-driven families set on 400 acres in the mountain valley of Pérez Zeledón. It is the only place where sustainable luxury, a Waldorf childhood, and entrepreneurial ambition coexist without compromise.',
  'RISE es una comunidad residencial curada para familias con propósito ubicada en 400 acres en el valle montañoso de Pérez Zeledón. Es el único lugar donde el lujo sostenible, una infancia Waldorf y la ambición emprendedora coexisten sin compromiso.',
  '/images/communities/rise-hero.webp',
  9.35, -83.65,
  '[[-83.655, 9.345], [-83.645, 9.345], [-83.645, 9.355], [-83.655, 9.355], [-83.655, 9.345]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.655 9.345, -83.645 9.345, -83.645 9.355, -83.655 9.355, -83.655 9.345))'),
  180000, 650000,
  '{"elevation": "1,000m", "airportDistance": "2.5 hours to SJO", "internet": "Fiber optic", "amenities": ["Waldorf School", "Saltwater Pool", "Co-working Hub", "Private Airstrip", "River & Waterfalls", "Kinkára Glamping"], "developer": "David Comfort", "established": "2023"}'::jsonb
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

-- 3. Insert Community: Serena San Mateo
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'serena-san-mateo',
  (SELECT id FROM areas WHERE slug = 'san-mateo'),
  'Serena San Mateo',
  'Live with space, with freedom, with intention.',
  'Vive con espacio, con libertad, con intención.',
  'Serena San Mateo is an intentional residential community offering flat, titled 5,000m² land lots with build-ready infrastructure, fiber-optic internet, and no HOA restrictions. It shares a sun-drenched landscape with renowned conscious living projects, bordering the scenic Machuca River.',
  'Serena San Mateo es una comunidad residencial intencional que ofrece lotes de terreno planos y titulados de 5.000m² con infraestructura lista para construir, internet de fibra óptica y sin restricciones de HOA. Comparte un paisaje soleado con renombrados proyectos de vida consciente, bordeando el escénico río Machuca.',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  9.94, -84.53,
  '[[-84.535, 9.935], [-84.525, 9.935], [-84.525, 9.945], [-84.535, 9.945], [-84.535, 9.935]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-84.535 9.935, -84.525 9.935, -84.525 9.945, -84.535 9.945, -84.535 9.935))'),
  120000, 350000,
  '{"elevation": "250m", "airportDistance": "1 hour to SJO", "internet": "Fiber optic", "amenities": ["No HOA Restrictions", "Machuca River access", "Clubhouse", "Saltwater Pool", "Sports Courts", "Eco-friendly Farms"], "developer": "Serena Dev Group", "established": "2025"}'::jsonb
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

-- 4. Insert Community: Residencial La Piedra
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'residencial-la-piedra',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'Residencial La Piedra',
  'Mountain views, pure fresh air, and deep peace.',
  'Vistas a la montaña, aire puro y paz profunda.',
  'Residencial La Piedra is a premium residential development located in the scenic mountain sector of La Piedra de Rivas, Pérez Zeledón. Nestled at the foothills of Chirripó National Park, the community features sprawling views, crisp highland air, and pristine river frontage.',
  'Residencial La Piedra es un desarrollo residencial premium ubicado en el pintoresco sector montañoso de La Piedra de Rivas, Pérez Zeledón. Situado a las faldas del Parque Nacional Chirripó, la comunidad ofrece vistas espectaculares, aire fresco de altura y frente a ríos prístinos.',
  '/images/communities/la-piedra-hero.webp',
  9.46, -83.62,
  '[[-83.625, 9.455], [-83.615, 9.455], [-83.615, 9.465], [-83.625, 9.465], [-83.625, 9.455]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.625 9.455, -83.615 9.455, -83.615 9.465, -83.625 9.465, -83.625 9.455))'),
  95000, 280000,
  '{"elevation": "1,100m", "airportDistance": "3 hours to SJO", "internet": "Fiber optic", "amenities": ["Highland Climate", "River Frontage", "Chirripó Views", "Permaculture Zones", "Hiking Trails"], "developer": "Rivas Eco Development", "established": "2024"}'::jsonb
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

-- 5. Insert Community: Villas San Miguel
INSERT INTO "communities" (
  "slug", "area_id", "name", "tagline_en", "tagline_es", "description_en", "description_es", 
  "hero_image_url", "latitude", "longitude", "geo_fence_coords", "geo_fence", "price_min_usd", "price_max_usd", "quick_facts"
) VALUES (
  'villas-san-miguel',
  (SELECT id FROM areas WHERE slug = 'perez-zeledon'),
  'Villas San Miguel',
  'Spectacular mountain views and warm highland climate.',
  'Espectaculares vistas a la montaña y clima fresco.',
  'Villas San Miguel is a highly anticipated residential community located in San Miguel de Páramo, Pérez Zeledón. Developed by three local partners (Heiner, Carlos, Fredy), the project features spectacular mountain views and a warm highland climate just 15 minutes from the center of Perez Zeledon. The logo is inspired by a historic mango tree on the property.',
  'Villas San Miguel es una comunidad residencial sumamente esperada ubicada en San Miguel de Páramo, Pérez Zeledón. Desarrollado por tres socios locales (Heiner, Carlos, Fredy), el proyecto cuenta con espectaculares vistas a la montaña y un clima cálido a solo 15 minutos del centro de Pérez Zeledón. El logotipo está inspirado en un árbol histórico de mango en la propiedad.',
  '/images/communities/san-miguel-hero.webp',
  9.39, -83.74,
  '[[-83.745, 9.385], [-83.735, 9.385], [-83.735, 9.395], [-83.745, 9.395], [-83.745, 9.385]]'::jsonb,
  ST_GeographyFromText('SRID=4326;POLYGON((-83.745 9.385, -83.735 9.385, -83.735 9.395, -83.745 9.395, -83.745 9.385))'),
  85000, 240000,
  '{"elevation": "850m", "airportDistance": "3 hours to SJO", "internet": "Fiber optic", "amenities": ["Historical Mango Tree Park", "Spectacular Mountain Views", "15 minutes to City Center", "Gated Entrance", "Fruit Orchards"], "developer": "Heiner, Carlos & Fredy", "established": "2026"}'::jsonb
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
