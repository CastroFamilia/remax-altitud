-- Uvita & Bahía Ballena metadata update
UPDATE "areas"
SET
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"elevation": "0 m – 200 m (0 ft – 650 ft)", "climate": "24°C – 32°C (75°F – 90°F)", "altitudeEn": "0 m – 200 m (0 ft – 650 ft)", "altitudeEs": "0 m – 200 m (0 ft – 650 ft)", "tempEn": "24°C – 32°C (75°F – 90°F)", "tempEs": "24°C – 32°C (75°F – 90°F)"}'::jsonb
WHERE "slug" = 'uvita';

-- Ojochal & Coronado metadata update
UPDATE "areas"
SET
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"elevation": "0 m – 400 m (0 ft – 1,300 ft)", "climate": "23°C – 31°C (73°F – 88°F)", "altitudeEn": "0 m – 400 m (0 ft – 1,300 ft)", "altitudeEs": "0 m – 400 m (0 ft – 1.300 ft)", "tempEn": "23°C – 31°C (73°F – 88°F)", "tempEs": "23°C – 31°C (73°F – 88°F)"}'::jsonb
WHERE "slug" = 'ojochal';

-- Tinamastes, Platanillo & Barú metadata and description text update
UPDATE "areas"
SET
  "description_en" = replace(
    replace("description_en", 'Rising from 400 meters up to 900 meters (1,300 to 3,000 feet)', 'Rising from 600 meters up to 900 meters (2,000 to 3,000 feet)'),
    'Rising from 400 meters up to 900 meters (1,300 to 3,000 feet)', 'Rising from 600 meters up to 900 meters (2,000 to 3,000 feet)'
  ),
  "description_es" = replace(
    replace("description_es", 'Elevándose desde los 400 metros hasta los 900 metros (1,300 a 3,000 pies)', 'Elevándose desde los 600 metros hasta los 900 metros (2,000 a 3,000 pies)'),
    'Elevándose desde los 400 metros hasta los 900 metros (1,300 a 3,000 pies)', 'Elevándose desde los 600 metros hasta los 900 metros (2,000 a 3,000 pies)'
  ),
  "metadata" = coalesce("metadata", '{}'::jsonb) || '{"elevation": "600 m – 900 m (2,000 ft – 3,000 ft)", "climate": "18°C – 26°C (64°F – 78°F)", "altitudeEn": "600 m – 900 m (2,000 ft – 3,000 ft)", "altitudeEs": "600 m – 900 m (2.000 ft – 3.000 ft)", "tempEn": "18°C – 26°C (64°F – 78°F)", "tempEs": "18°C – 26°C (64°F – 78°F)"}'::jsonb
WHERE "slug" = 'tinamastes-platanillo';
