UPDATE communities
SET geo_fence = ST_GeographyFromText('SRID=4326;POLYGON((' || 
  (SELECT string_agg(coords->>0 || ' ' || coords->>1, ', ') 
   FROM jsonb_array_elements(geo_fence_coords) coords) || 
  ', ' || 
  (SELECT (geo_fence_coords->0->>0) || ' ' || (geo_fence_coords->0->>1)) || 
  '))')
WHERE geo_fence_coords IS NOT NULL AND jsonb_array_length(geo_fence_coords) >= 3;
