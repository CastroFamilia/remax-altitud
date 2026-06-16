-- Fix Santa Elena Hills hero image URL
-- The initial migration (0015) set an Unsplash placeholder URL which is not
-- in Next.js remotePatterns, causing the hero <Image> to fail to load.
-- Migration 0019 should have updated it to the local path, but this ensures
-- the correct value is set regardless of migration execution order.
UPDATE communities
SET hero_image_url = '/images/santa-elena-hills.png'
WHERE slug = 'santa-elena-hills'
  AND (hero_image_url IS NULL
    OR hero_image_url NOT LIKE '/images/%');
