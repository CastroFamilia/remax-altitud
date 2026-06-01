-- Pérez Zeledón
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'perez-zeledon', 'Pérez Zeledón', 'Pérez Zeledón', 'Mountain',
  'A lush mountain valley in southern Costa Rica, Pérez Zeledón offers a unique blend of tropical climate and mountain serenity.',
  'Un exuberante valle montañoso en el sur de Costa Rica, Pérez Zeledón ofrece una combinación única de clima tropical y serenidad montañosa.',
  '/images/areas/perez-zeledon-hero.webp', 'San José', 'Pérez Zeledón', 'San Isidro', 9.37, -83.7, 1,
  '{"elevation": "700m", "climate": "Tropical humid", "nearestAirport": "San José (SJO) — 3.5 hours", "nearestHospital": "Hospital Escalante Pradilla — 15 min", "nearestBeach": "Dominical — 45 min", "investmentContext": {"appreciationTrend": "5-8% annual appreciation over 5 years", "rentalYieldEstimate": "4-6% for long-term rentals", "marketHighlights": ["Growing expat community", "New hospital and university", "Lower entry prices than coastal areas"]}}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "metadata" = coalesce(areas.metadata, '{}'::jsonb) || '{"investmentContext": {"appreciationTrend": "5-8% annual appreciation over 5 years", "rentalYieldEstimate": "4-6% for long-term rentals", "marketHighlights": ["Growing expat community", "New hospital and university", "Lower entry prices than coastal areas"]}}'::jsonb;

--> statement-breakpoint

-- Dominical
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'dominical', 'Dominical', 'Dominical', 'Coast',
  'A vibrant surf town on the Pacific coast, Dominical is world-famous for its year-round waves, pristine tropical forests, and diverse marine life.',
  'Un vibrante pueblo surfista en la costa del Pacífico, Dominical es mundialmente famoso por sus olas todo el año, bosques tropicales prístinos y diversa vida marina.',
  '/images/areas/dominical-hero.webp', 'Puntarenas', 'Osa', 'Bahía Ballena', 9.25, -83.86, 2,
  '{"elevation": "0-50m", "climate": "Tropical wet", "nearestAirport": "Quepos (XQP) — 35 min", "nearestHospital": "Hospital de Osa — 25 min", "nearestBeach": "Dominical Beach — 0 min", "investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "metadata" = coalesce(areas.metadata, '{}'::jsonb) || '{"investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb;

--> statement-breakpoint

-- Uvita
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'uvita', 'Uvita', 'Uvita', 'Coast',
  'Home to the famous Whale Tail beach formation, Uvita is a bustling coastal hub with stunning national parks and an expanding community.',
  'Hogar de la famosa formación de playa Cola de Ballena, Uvita es un centro costero vibrante con impresionantes parques nacionales.',
  '/images/areas/uvita-hero.webp', 'Puntarenas', 'Osa', 'Bahía Ballena', 9.17, -83.74, 3,
  '{"elevation": "0-100m", "climate": "Tropical wet", "nearestAirport": "Quepos (XQP) — 45 min", "nearestHospital": "Hospital de Osa — 15 min", "nearestBeach": "Uvita Beach (Marino Ballena) — 5 min", "investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "metadata" = coalesce(areas.metadata, '{}'::jsonb) || '{"investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb;
