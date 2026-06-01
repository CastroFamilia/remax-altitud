-- Update the definitive featured communities details (RISE, Santa Elena Hills, Harmony Heights, SERENA San Mateo, Residencial La Piedra, Villas San Miguel)
-- Incorporate language overrides for custom price and size ranges and hook up custom images

-- 1. RISE Costa Rica
UPDATE communities
SET
  price_min_usd = 150000,
  size_min_m2 = 2000,
  size_max_m2 = 15000,
  hero_image_url = '/images/rise-costa-rica.png',
  quick_facts = quick_facts || '{"priceRangeEn": "Starting at $150,000", "priceRangeEs": "Desde $150.000", "sizeRangeEn": "2,000–15,000 m² (0.5–4 ac)", "sizeRangeEs": "2.000–15.000 m² (0.5–4 ac)"}'::jsonb
WHERE slug = 'rise-costa-rica';

-- 2. Santa Elena Hills
UPDATE communities
SET
  price_min_usd = 170000,
  size_min_m2 = 10000,
  size_max_m2 = 160000,
  hero_image_url = '/images/santa-elena-hills.png',
  quick_facts = quick_facts || '{"priceRangeEn": "Starting at $170,000", "priceRangeEs": "Desde $170.000", "sizeRangeEn": "1–16 ha (2.5–40 ac)", "sizeRangeEs": "1–16 ha (2.5–40 ac)"}'::jsonb
WHERE slug = 'santa-elena-hills';

-- 3. Harmony Heights
UPDATE communities
SET
  price_min_usd = 65000,
  size_min_m2 = 1000,
  size_max_m2 = 1300,
  hero_image_url = '/images/harmony-heights.png',
  quick_facts = quick_facts || '{"priceRangeEn": "Starting at $65,000", "priceRangeEs": "Desde $65.000", "sizeRangeEn": "1,000–1,300 m²", "sizeRangeEs": "1.000–1.300 m²"}'::jsonb
WHERE slug = 'harmony-heights';

-- 4. SERENA San Mateo
UPDATE communities
SET
  price_min_usd = 130000,
  size_min_m2 = 5000,
  size_max_m2 = 5000,
  hero_image_url = '/images/serena-san-mateo.png',
  quick_facts = quick_facts || '{"priceRangeEn": "Starting at $130,000", "priceRangeEs": "Desde $130.000", "sizeRangeEn": "5,000 m² (1.24 ac)", "sizeRangeEs": "5.000 m² (1.24 ac)"}'::jsonb
WHERE slug = 'serena-san-mateo';

-- 5. Residencial La Piedra
UPDATE communities
SET
  price_min_usd = 30000,
  price_max_usd = 60000,
  size_min_m2 = 800,
  size_max_m2 = 1900,
  hero_image_url = '/images/la-piedra.png',
  quick_facts = quick_facts || '{"priceRangeEn": "₡15M–₡30M", "priceRangeEs": "₡15M–₡30M", "sizeRangeEn": "800–1,900 m²", "sizeRangeEs": "800–1.900 m²"}'::jsonb
WHERE slug = 'residencial-la-piedra';

-- 6. Villas San Miguel
UPDATE communities
SET
  price_min_usd = 96000,
  size_min_m2 = 1300,
  size_max_m2 = 1800,
  hero_image_url = '/images/villas-san-miguel.png',
  quick_facts = quick_facts || '{"priceRangeEn": "Starting at ₡48M", "priceRangeEs": "Desde ₡48M", "sizeRangeEn": "1,300–1,800 m²", "sizeRangeEs": "1.300–1.800 m²"}'::jsonb
WHERE slug = 'villas-san-miguel';
