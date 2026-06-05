import { db } from './src/lib/db/index.js';
import { properties } from './src/lib/db/schema/properties.js';
import { isNotNull } from 'drizzle-orm';

async function check() {
  const props = await db.select({
    slug: properties.slug,
    youtubeUrl: properties.youtubeUrl,
    virtualTourUrl: properties.virtualTourUrl,
  }).from(properties).where(isNotNull(properties.youtubeUrl));
  
  console.log("With youtubeUrl:", props);
  
  const props2 = await db.select({
    slug: properties.slug,
    virtualTourUrl: properties.virtualTourUrl,
  }).from(properties).where(isNotNull(properties.virtualTourUrl));
  
  console.log("With virtualTourUrl:", props2);
  
  process.exit(0);
}

check().catch(console.error);
