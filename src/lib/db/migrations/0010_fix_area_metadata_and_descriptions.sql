-- Pérez Zeledón detailed copy and metadata merge
UPDATE "areas"
SET
  "description_en" = $$San Isidro de El General: A City That Has It All with Excellent Connectivity

At the heart of the region lies San Isidro de El General, the largest and most developed city in southern Costa Rica. Moving to a rural area here does not mean giving up urban conveniences or accessibility. San Isidro provides robust infrastructure, a city center that has it all, and seamless regional travel options.

### Everyday Essential Services

[SERVICES_LIST]

### Real Estate Breakdown: Where to Buy in Pérez Zeledón

San Isidro de El General sits perfectly in the center of the valley. From this central urban hub, the geography fans out in all four cardinal directions; each offering distinct microclimates, lifestyles, and specific types of investment properties.

[CARDINAL_MAP]

[CARDINAL_CARDS]

### Rural & Sustainable Homes

If your goal is an organic lifestyle; waking up to the sound of a river, picking fruit from your own trees, and owning a home built with sustainable materials; Pérez Zeledón is an ideal destination. The rural property market here is highly diverse, ranging from small eco-cottages to large sustainable luxury estates.

### Find Your Property with REMAX Altitud

Whether you are looking for a modern condo near city amenities, a large agricultural estate with its own waterfalls, or a home inside an exclusive eco-community, our team at REMAX Altitud is deeply rooted in the local market. We specialize in matching international investors and families with properties that elevate their quality of life.

[CTA_BUTTON]$$,
  "description_es" = $$San Isidro de El General: Una ciudad que lo tiene todo con excelente conectividad

En el corazón de la región se encuentra San Isidro de El General, la ciudad más grande y desarrollada del sur de Costa Rica. Mudarse a una zona rural aquí no significa renunciar a las comodidades urbanas ni a la accesibilidad. San Isidro ofrece una infraestructura sólida, un centro urbano que lo tiene todo y opciones de transporte regional inmejorables.

### Servicios Esenciales Diarios

[SERVICES_LIST]

### Desglose inmobiliario: Dónde comprar en Pérez Zeledón

San Isidro de El General se ubica perfectamente en el centro del valle. Desde este núcleo urbano central, la geografía se despliega en las cuatro direcciones cardinales, cada una ofreciendo microclimas, estilos de vida y tipos específicos de propiedades de inversión únicos.

[CARDINAL_MAP]

[CARDINAL_CARDS]

### Casas rurales y sostenibles

Si su objetivo es un estilo de vida orgánico; despertarse con el sonido de un río, cosechar frutas de sus propios árboles y ser dueño de una casa construida con materiales sostenibles, Pérez Zeledón es el destino ideal. El mercado de propiedades rurales aquí es muy diverso, abarcando desde pequeñas cabañas ecológicas hasta grandes propiedades sostenibles de lujo.

### Encuentre su propiedad con REMAX Altitud

Ya sea que busque un condominio moderno cerca de los servicios de la ciudad, una gran propiedad agrícola con sus propias cascadas o una casa dentro de una comunidad ecológica exclusiva, nuestro equipo en REMAX Altitud está profundamente arraigado en el mercado local. Nos especializamos en conectar a inversionistas internacionales y familias con propiedades que elevan su calidad de vida.

[CTA_BUTTON]$$,
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"h1En": "Barefoot Luxury & Mountain Living: Discover Pérez Zeledón, Costa Rica", "h1Es": "Lujo Descalzo y Vida de Montaña: Descubra Pérez Zeledón, Costa Rica", "seoTitleEn": "Affordable Properties for Sale in Pérez Zeledón | Barefoot Luxury Costa Rica", "seoTitleEs": "Propiedades en Venta en Pérez Zeledón | Lujo Descalzo Costa Rica", "seoDescriptionEn": "Explore real estate in Pérez Zeledón. Discover affordable barefoot luxury homes, off-grid mountain farms with private waterfalls, and properties near San Isidro de El General.", "seoDescriptionEs": "Explore bienes raíces en Pérez Zeledón. Descubra casas de lujo, fincas de montaña autosostenibles con cascadas privadas y propiedades cerca de San Isidro.", "nearestAirport": "San José (SJO) — 3.5 hours / Pérez Zeledón Airstrip", "nearestHospital": "Hospital Escalante Pradilla — 15 min", "nearestBeach": "Dominical — 45 min", "investmentContext": {"appreciationTrend": "5-8% annual appreciation over 5 years", "rentalYieldEstimate": "4-6% for long-term rentals", "marketHighlights": ["Growing expat community", "New hospital and university", "Lower entry prices than coastal areas"]}}'::jsonb
WHERE "slug" = 'perez-zeledon';

--> statement-breakpoint

-- Dominical metadata restore
UPDATE "areas"
SET
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"nearestAirport": "Quepos (XQP) — 35 min", "nearestHospital": "Hospital de Osa — 25 min", "nearestBeach": "Dominical Beach — 0 min", "investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb
WHERE "slug" = 'dominical';

--> statement-breakpoint

-- Uvita metadata restore
UPDATE "areas"
SET
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"nearestAirport": "Quepos (XQP) — 45 min", "nearestHospital": "Hospital de Osa — 15 min", "nearestBeach": "Uvita Beach (Marino Ballena) — 5 min", "investmentContext": {"appreciationTrend": "8-12% annual appreciation over 5 years", "rentalYieldEstimate": "6-10% for vacation rentals", "marketHighlights": ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"]}}'::jsonb
WHERE "slug" = 'uvita';
