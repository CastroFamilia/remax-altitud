-- Clear all communities/projects data from the database
-- 1. Remove references to communities in properties
UPDATE "properties" SET "community_id" = NULL;

-- 2. Delete all records from the communities table
DELETE FROM "communities";