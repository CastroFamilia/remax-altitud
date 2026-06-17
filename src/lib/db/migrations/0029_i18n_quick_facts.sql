-- Migration: Add locale-specific quick facts keys (EN/ES) to community JSONB
-- This splits mixed-language values (e.g. "Fiber Optic / Fibra óptica") into proper _en/_es keys
-- and adds Spanish translations for communities that only had English values.
-- Legacy unsuffixed keys are preserved for backward compatibility.

-- 1. RISE Costa Rica — split mixed "EN / ES" values
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "1,000 meters (3,280 feet)",
  "elevationEs": "1.000 metros (3.280 pies)",
  "airportDistanceEn": "Airstrip on site, 20 min to PZ Airport, 3 hours to SJO",
  "airportDistanceEs": "Pista de aterrizaje en sitio, 20 min al aeropuerto PZ, 3 horas a SJO",
  "internetEn": "Fiber Optic",
  "internetEs": "Fibra óptica",
  "developerEn": "David Comfort / New Earth Preservation S.A.",
  "developerEs": "David Comfort / New Earth Preservation S.A.",
  "establishedEn": "2022 (Only selling to full-time families, no investors)",
  "establishedEs": "2022 (Solo vende a familias de tiempo completo, no a inversionistas)",
  "amenitiesEn": ["Clubhouse", "Salt Pool", "Kinkará Retreat Center", "Waldorf-Inspired School", "Private Airstrip", "Commercial Areas", "River with water holes", "Biking & Hiking Trails"],
  "amenitiesEs": ["Casa club", "Piscina de sal", "Centro de Retiros Kinkará", "Escuela inspirada en Waldorf", "Pista de aterrizaje privada", "Áreas comerciales", "Río con pozas y cataratas", "Senderos para ciclismo y caminatas"]
}'::jsonb
WHERE slug = 'rise-costa-rica';

--> statement-breakpoint

-- 2. Villas San Miguel — split mixed "EN / ES" values
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "850m",
  "elevationEs": "850m",
  "airportDistanceEn": "3 hours to SJO",
  "airportDistanceEs": "3 horas a SJO",
  "internetEn": "Fiber optic",
  "internetEs": "Fibra óptica",
  "developerEn": "Desarrollo Inmobiliario Villas San Miguel",
  "developerEs": "Desarrollo Inmobiliario Villas San Miguel",
  "establishedEn": "2026",
  "establishedEs": "2026",
  "amenitiesEn": ["School (500m)", "Store (800m)", "Pérez Zeledón (15 min)", "Lots (1,300 - 1,800 m²)", "Incredible Views", "Tranquility"],
  "amenitiesEs": ["Escuela (500m)", "Abastecedor (800m)", "Pérez Zeledón (15 min)", "Lotes (1.300 - 1.800 m²)", "Vistas increíbles", "Tranquilidad"]
}'::jsonb
WHERE slug = 'villas-san-miguel';

--> statement-breakpoint

-- 3. Serena San Mateo — add Spanish translations
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "250m",
  "elevationEs": "250m",
  "airportDistanceEn": "1 hour to SJO",
  "airportDistanceEs": "1 hora a SJO",
  "internetEn": "Fiber optic",
  "internetEs": "Fibra óptica",
  "developerEn": "Serena Dev Group",
  "developerEs": "Serena Dev Group",
  "establishedEn": "2025",
  "establishedEs": "2025",
  "amenitiesEn": ["No HOA Restrictions", "Machuca River access", "Clubhouse", "Saltwater Pool", "Sports Courts", "Eco-friendly Farms"],
  "amenitiesEs": ["Sin restricciones de HOA", "Acceso al río Machuca", "Casa club", "Piscina de agua salada", "Canchas deportivas", "Granjas ecológicas"]
}'::jsonb
WHERE slug = 'serena-san-mateo';

--> statement-breakpoint

-- 4. Residencial La Piedra — add Spanish translations
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "1,100m",
  "elevationEs": "1.100m",
  "airportDistanceEn": "3 hours to SJO",
  "airportDistanceEs": "3 horas a SJO",
  "internetEn": "Fiber optic",
  "internetEs": "Fibra óptica",
  "developerEn": "Rivas Eco Development",
  "developerEs": "Rivas Eco Development",
  "establishedEn": "2024",
  "establishedEs": "2024",
  "amenitiesEn": ["Highland Climate", "River Frontage", "Chirripó Views", "Permaculture Zones", "Hiking Trails"],
  "amenitiesEs": ["Clima de altura", "Frente al río", "Vistas al Chirripó", "Zonas de permacultura", "Senderos"]
}'::jsonb
WHERE slug = 'residencial-la-piedra';

--> statement-breakpoint

-- 5. Santa Elena Hills — add Spanish translations
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "1,000m",
  "elevationEs": "1.000m",
  "airportDistanceEn": "3 hours to SJO",
  "airportDistanceEs": "3 horas a SJO",
  "internetEn": "Fiber optic",
  "internetEs": "Fibra óptica",
  "developerEn": "Santa Elena Hills SA",
  "developerEs": "Santa Elena Hills SA",
  "establishedEn": "2026",
  "establishedEs": "2026",
  "amenitiesEn": ["Estate Lots (1 - 15 Hectares)", "Panoramic Mountain Views", "Blend of Flat & Ridged Terrain", "Luxury Homestead ready", "Boutique Development Potential", "Pristine Nature"],
  "amenitiesEs": ["Lotes tipo finca (1 - 15 hectáreas)", "Vistas panorámicas a la montaña", "Combinación de terreno plano y elevado", "Listo para fincas de lujo", "Potencial para desarrollo boutique", "Naturaleza virgen"]
}'::jsonb
WHERE slug = 'santa-elena-hills';

--> statement-breakpoint

-- 6. Harmony Heights — add Spanish translations
UPDATE communities
SET quick_facts = quick_facts || '{
  "elevationEn": "1,000m",
  "elevationEs": "1.000m",
  "airportDistanceEn": "3 hours to SJO",
  "airportDistanceEs": "3 horas a SJO",
  "internetEn": "Fiber optic",
  "internetEs": "Fibra óptica",
  "developerEn": "Harmony Dev Group",
  "developerEs": "Harmony Dev Group",
  "establishedEn": "2026",
  "establishedEs": "2026",
  "amenitiesEn": ["100% Usable Terrain", "Flat Topography", "Ready to Build Lots", "Ideal Climate (20°C - 28°C)", "Peaceful Community", "Effortless Construction"],
  "amenitiesEs": ["100% terreno utilizable", "Topografía plana", "Lotes listos para construir", "Clima ideal (20°C - 28°C)", "Comunidad tranquila", "Construcción sin complicaciones"]
}'::jsonb
WHERE slug = 'harmony-heights';
