-- Pérez Zeledón
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'perez-zeledon', 'Pérez Zeledón', 'Pérez Zeledón', 'Mountain',
  'True mountain barefoot luxury, famous for its crystal-clear rivers, majestic waterfalls, and lush green landscapes. It offers the perfect balance: living immersed in pure nature while remaining minutes away from San Isidro de El General, the largest service hub in the south with private hospitals, banks, shopping, and top connectivity. Ideal for those seeking privacy, a refreshing high-altitude climate, and complete logistical convenience.',
  'El verdadero lujo barefoot de montaña, famoso por sus ríos cristalinos, majestuosas cataratas y exuberantes paisajes verdes. Ofrece el equilibrio perfecto: una vida sumergida en la naturaleza pura pero con acceso inmediato a San Isidro de El General, el centro de servicios más grande del sur con hospitales privados, bancos, centros comerciales y excelente conectividad. Ideal para quienes buscan privacidad, un clima fresco de altura y total comodidad logística.',
  '/images/areas/perez-zeledon-hero.webp', 'San José', 'Pérez Zeledón', 'San Isidro', 9.37, -83.7, 1,
  '{"altitudeEn": "700 m – 1,200 m (2,300 ft – 3,900 ft)", "altitudeEs": "700 m – 1.200 m (2.300 ft – 3.900 ft)", "tempEn": "20°C – 28°C (68°F – 82°F)", "tempEs": "20°C – 28°C (68°F – 82°F)", "elevation": "700m - 1200m", "climate": "20°C - 28°C"}'::jsonb
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

-- Dominical
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'dominical', 'Dominical', 'Dominical', 'Coast',
  'The epicenter of absolute oceanfront luxury, where untamed tropical rainforest meets powerful coastal rivers and world-class surf breaks. Its exclusive hillsides shelter jaw-dropping, premium architectural villas with complete privacy and infinite ocean views, while remaining just 30 minutes from major city infrastructure. The ultimate destination for high-end global investors demanding security, lush nature, and top-tier real estate appreciation.',
  'El epicentro del lujo absoluto frente al mar, donde la selva tropical indomable se encuentra con imponentes ríos y olas de surf de clase mundial. Sus exclusivas colinas albergan impresionantes villas arquitectónicas premium con total privacidad y vistas infinitas al océano, estando a solo 30 minutos de los principales servicios de la ciudad. El destino definitivo para inversionistas globales de alta gama que buscan seguridad, naturaleza exuberante y alta plusvalía.',
  '/images/areas/dominical-hero.webp', 'Puntarenas', 'Osa', 'Bahía Ballena', 9.25, -83.86, 2,
  '{"altitudeEn": "0 m – 300 m (0 ft – 1,000 ft)", "altitudeEs": "0 m – 300 m (0 ft – 1.000 ft)", "tempEn": "24°C – 32°C (75°F – 90°F)", "tempEs": "24°C – 32°C (75°F – 90°F)", "elevation": "0-300m", "climate": "24°C - 32°C"}'::jsonb
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

-- Tinamastes y Platanillo
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'tinamastes-platanillo', 'Tinamastes & Platanillo', 'Tinamastes y Platanillo', 'Mountain',
  'A strategic connection corridor offering the perfect climate balance: cool mountain breezes just 15 minutes from the beach. Famous for natural fresh springs, clean rivers, and spectacular waterfalls, it is the heart of sustainable living, organic farmers'' markets, and communities centered on wellness and alternative education. A premium location providing total peace with rapid access to both city services and the coast.',
  'El corredor de conexión que ofrece el balance climático perfecto: brisas frescas de montaña a solo 15 minutos de la playa. Famoso por sus nacientes de agua, ríos limpios y espectaculares cataratas, es el corazón de la vida sostenible, ferias orgánicas y comunidades enfocadas en el bienestar y la educación alternativa. Una ubicación estratégica que permite disfrutar de paz absoluta con rápido acceso tanto a los servicios de la ciudad como a la costa.',
  '/images/areas/tinamastes-platanillo-hero.webp', 'Puntarenas', 'Pérez Zeledón', 'Barú', 9.28, -83.77, 3,
  '{"altitudeEn": "600 m – 900 m (2,000 ft – 3,000 ft)", "altitudeEs": "600 m – 900 m (2.000 ft – 3.000 ft)", "tempEn": "18°C – 26°C (64°F – 78°F)", "tempEs": "18°C – 26°C (64°F – 78°F)", "elevation": "600-900m", "climate": "18°C - 26°C"}'::jsonb
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

-- Uvita y Bahía Ballena
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'uvita', 'Uvita & Bahía Ballena', 'Uvita y Bahía Ballena', 'Coast',
  'The residential and commercial powerhouse of the coast, world-famous for the Marino Ballena National Park and surrounded by mystical jungle-hidden waterfalls. It perfectly balances pristine beaches with top-tier local infrastructure, including bilingual international schools, banks, gourmet markets, and medical clinics. A high-growth area ideal for active families and high-yielding vacation rentals.',
  'El motor residencial y comercial de la costa, famoso a nivel mundial por el Parque Nacional Marino Ballena y rodeado de místicas cascadas escondidas en la selva. Combina playas vírgenes con una excelente infraestructura local que incluye escuelas bilingües, bancos, supermercados gourmet y clínicas médicas. Es una zona de altísima demanda y crecimiento, perfecta tanto para familias activas como para rentas vacacionales de alto rendimiento.',
  '/images/areas/uvita-hero.webp', 'Puntarenas', 'Osa', 'Bahía Ballena', 9.17, -83.74, 4,
  '{"altitudeEn": "0 m – 200 m (0 ft – 650 ft)", "altitudeEs": "0 m – 200 m (0 ft – 650 ft)", "tempEn": "24°C – 32°C (75°F – 90°F)", "tempEs": "24°C – 32°C (75°F – 90°F)", "elevation": "0-200m", "climate": "24°C - 32°C"}'::jsonb
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

-- Ojochal y Coronado
INSERT INTO "areas" (
  "slug", "name_en", "name_es", "region", "description_en", "description_es", 
  "hero_image_url", "province", "canton", "district", "latitude", "longitude", 
  "sort_order", "metadata"
) VALUES (
  'ojochal', 'Ojochal & Coronado', 'Ojochal y Coronado', 'Coast',
  'A discreet and sophisticated residential sanctuary, celebrated for its high-end international culinary scene, pristine rivers, and absolute jungle privacy. Its lush elevations hide exclusive luxury estates boasting spectacular views of the ocean, dramatic mountain walls, and protected mangroves. Designed for those seeking a peaceful, secure, and upscale lifestyle with easy access to coastal services.',
  'Un santuario residencial discreto y sofisticado, célebre por su alta gastronomía internacional, ríos prístinos y absoluta privacidad en la selva. Sus frondosas colinas resguardan exclusivas propiedades de lujo con vistas espectaculares al océano, imponentes cadenas montañosas y manglares protegidos. Diseñado para quienes buscan un ritmo de vida pacífico, seguro y exclusivo, con fácil acceso a los servicios esenciales de la zona costera.',
  '/images/areas/ojochal-hero.webp', 'Puntarenas', 'Osa', 'Bahía Ballena', 9.08, -83.65, 5,
  '{"altitudeEn": "0 m – 400 m (0 ft – 1,300 ft)", "altitudeEs": "0 m – 400 m (0 ft – 1.300 ft)", "tempEn": "23°C – 31°C (73°F – 88°F)", "tempEs": "23°C – 31°C (73°F – 88°F)", "elevation": "0-400m", "climate": "23°C - 31°C"}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
  "name_en" = EXCLUDED.name_en,
  "name_es" = EXCLUDED.name_es,
  "region" = EXCLUDED.region,
  "description_en" = EXCLUDED.description_en,
  "description_es" = EXCLUDED.description_es,
  "sort_order" = EXCLUDED.sort_order,
  "metadata" = EXCLUDED.metadata;
