-- Set property types for all communities to "Lots" / "Lotes"
-- All current communities sell lots exclusively.
UPDATE communities SET property_types_en = 'Lots', property_types_es = 'Lotes'
WHERE property_types_en = '' OR property_types_en IS NULL;
