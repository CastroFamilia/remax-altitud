import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { areas } from "../schema/areas";

config({ path: "/Users/alejandracastro/Desktop/ALTITUD HUB/.env.local" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

const descriptionEn = `Elite Coastal Discovery: Discover Uvita & Bahía Ballena, Costa Rica

Welcome to Uvita and Bahía Ballena, the residential, commercial, and tourism powerhouse of Costa Rica’s South Pacific coast. Where neighboring beach towns favor a more rustic or strictly secluded approach, Uvita stands as a thriving, self-sustaining coastal community that perfectly balances world-famous natural wonders with top-tier modern infrastructure.

It is home to the legendary Marino Ballena National Park, where the ocean reveals its signature masterpiece: a perfect, natural sandbar formation resembling a giant Whale Tail. This region is a magnetic destination for active international families, remote executives, and wellness seekers who demand premium modern services, top-tier bilingual schools, and high-yielding vacation real estate.

The Uvita & Bahía Ballena Lifestyle: Whale Tails, Waterfalls, and Modern Convenience

Living in Uvita means immersing yourself in a highly active and integrated coastal lifestyle. Here, you don't have to sacrifice urban logistics for tropical beauty. The town center features two major supermarkets, national bank branches, gourmet organic grocers, medical clinics, and a vibrant international dining scene that rivals the country's best culinary hubs.

For families, the region is highly coveted due to its premium private educational options, including bilingual K-12 international academies like Uvita Christian Academy and local green schools. 

The geography here is highly dynamic. Rising immediately from the flat, pristine coastline up into the dramatic, jungle-draped ridges of the Fila Costeña mountain range, Uvita offers a rich variety of microclimates and residential options. Whether you want to live steps from the soft sand inside the maritime zone or prefer to ascend 200 meters up the ridges to catch constant ocean breezes and jaw-dropping sunset views over the Whale Tail, Uvita delivers the ultimate coastal experience.

### High-End Coastal Real Estate: Where to Invest

The Uvita real estate market is one of the fastest-growing and most robust in Central America. Properties are highly diverse, segmented by elevation, closeness to the beach, and rental potential.

\`\`\`
                           THE UPPER HERMOSA & SAN MARTIN RIDGES
              (Contemporary Luxury Estates, Infinity Pools, 180° Whale Tail Views)
                                             ▲
                                             │ (10 min)
                                             ▼
                             UVITA COMMERCIAL TOWN CENTER
                (Gourmet Markets, Banks, Bilingual Schools, Medical Plaza)
                                             ▲
                      ┌──────────────────────┴──────────────────────┐
                      │ (5 min)                                     │ (5 min)
                      ▼                                             ▼
          MARINO BALLENA NATIONAL PARK                       PLAYA HERMOSA
          (Whale Tail Beach, Whales, Reefs)                 (Surf Coast, Sunsets)
\`\`\`

1. **The Hermosa & San Martin Ridges**
* **The Vibe**: Elite luxury and dramatic scale. These steep, primary-forest ridges rise directly behind Playa Hermosa and Uvita, offering unmatched bird's-eye views of the Whale Tail and the endless Pacific horizon.
* **Property Types**: Multi-million dollar contemporary glass-and-steel architectural masterpieces, high-end solar smart-homes with expansive infinity pools, and exclusive mountain-ridge lots with large, flat building pads and secure gated access.

2. **Uvita Town Center & Flatlands**
* **The Vibe**: Highly walkable, active, and convenient. Close to all everyday services, restaurants, and schools.
* **Property Types**: Modern single-family homes with private pools, gated townhome communities perfect for expat families, and secure, high-yield vacation rental properties.

3. **Playa Bahia Ballena (The National Park Area)**
* **The Vibe**: Relaxed, coastal, and nature-first. Walking or biking distance to the Marino Ballena National Park entrance.
* **Property Types**: Eco-villas nestled in secondary growth forests, highly lucrative boutique bed-and-breakfasts, and rare concession properties in close proximity to the park boundaries.

4. **Whale Tail View Communities**
* **The Vibe**: Secure, community-centric luxury living. High-elevation enclaves with panoramic ocean views and shared jungle infrastructure.
* **Property Types**: Custom luxury homes built with local hardwoods and sustainable materials, offering legal ASADA water connections and high-speed fiber internet.

### Climate & Market Economics: Weather Patterns and Property Tiers

Investing in Uvita offers an exceptional blend of lifestyle utility and strong financial returns. As the commercial anchor of the Costa Ballena region, Uvita experiences year-round tourism demand, ensuring premium rental rates and exceptionally high occupancy percentages for vacation properties.

**The Microclimate & Coastal Warmth**

Uvita enjoys a warm, tropical beach climate with an average temperature of 24°C to 32°C (75°F to 90°F). While the lowlands receive warm coastal sun and pleasant ocean breezes, ascending just 100 to 200 meters up the mountainside creates a highly refreshing temperature drop. The cool mountain air flowing down the ridges at night eliminates the need for air conditioning, providing a perfect natural climate balance.

**Property Pricing Tiers & Investment Landscape**

The real estate market is highly structured, offering diverse entry points with exceptionally high ROI potential:

| Investment Tier | Pricing Range (USD) | Dominant Locations | Key Property Characteristics |
| --- | --- | --- | --- |
| Ocean-View Contemporary Estates | $1,200,000 – $3,500,000+ | Hermosa Ridges, San Martín | Ultra-luxury smart homes, infinity pools, panoramic Whale Tail views, absolute privacy, high-end finishes. |
| Modern Family Homes & Villas | $550,000 – $950,000 | Uvita Flatlands, Bahia | 3-4 bedroom custom builds, private pools, tropical landscaping, close to international schools and services. |
| High-Yield Vacation Rentals | $450,000 – $850,000 | Town Center, Marino Ballena | Turn-key 2-3 bedroom villas, proven rental history, walking distance to beaches, private pools, high-speed fiber. |
| Premium Ocean-View Lots | $180,000 – $450,000 | Mountain Ridges, Gated | Infrastructure-ready oceanview building pads with legal water (ASADA), internal road cuts, and designated building pads. |

### Strategic Infrastructure and Logistical Power

Uvita is the undisputed logistical hub of the South Pacific:
* **The Costanera Highway**: A fully paved, state-of-the-art highway that provides clean, high-speed connection north to Quepos (and its regional airport) and Manuel Antonio in just 45 minutes, and SJO International Airport in 3.5 hours.
* **Excellent Everyday Services**: The town features multiple major banks, pharmacies, premium organic markets, modern hardware stores, and the Coast Ballena's premier private medical centers.
* **High-Yield Rental Performance**: Boasting dual whale-watching seasons (December to April and July to October), Uvita maintains an exceptionally high year-round vacation rental occupancy, making it a highly attractive destination for passive-income investors.

### Find Your Property with RE/MAX Altitud

Whether your goal is a contemporary architectural masterpiece perched high on an exclusive oceanview ridge with a view of the Whale Tail, a modern family villa close to bilingual schools, or a high-yielding turn-key vacation rental near the national park, our team at RE/MAX Altitud in Uvita is your premier local authority. We specialize in matching international families, remote executives, and luxury investors with properties that elevate their lifestyle and secure their future.

[CTA_BUTTON]`;

const descriptionEs = `Descubra Uvita y Bahía Ballena: El Motor Costero y Santuario Natural

Bienvenido a Uvita y Bahía Ballena, el motor residencial, comercial y turístico de la costa del Pacífico Sur de Costa Rica. Mientras que los pueblos playeros vecinos favorecen un enfoque más rústico o estrictamente aislado, Uvita se erige como una próspera comunidad costera autosostenible que equilibra perfectamente las maravillas naturales de fama mundial con una infraestructura moderna de primer nivel.

Es el hogar del legendario Parque Nacional Marino Ballena, donde el océano revela su obra maestra: una formación natural de arena perfecta que se asemeja a una Cola de Ballena gigante. Esta región es un destino magnético para familias internacionales activas, ejecutivos remotos y buscadores de bienestar que exigen servicios modernos de primera calidad, excelentes escuelas bilingües y bienes raíces vacacionales de alto rendimiento.

El estilo de vida de Uvita y Bahía Ballena: Cola de Ballena, Cataratas y Conveniencia Moderna

Vivir en Uvita significa sumergirse en un estilo de vida costero altamente activo e integrado. Aquí no tiene que sacrificar la logística urbana por la belleza tropical. El centro del pueblo cuenta con dos grandes supermercados, sucursales bancarias nacionales, tiendas orgánicas gourmet, clínicas médicas y una vibrante oferta gastronómica internacional que rivaliza con los mejores centros culinarios del país.

Para las familias, la región es muy codiciada debido a sus opciones educativas privadas de alta calidad, que incluyen academias internacionales K-12 bilingües como Uvita Christian Academy y escuelas ecológicas locales.

La geografía aquí es altamente dinámica. Elevándose inmediatamente desde la costa plana y virgen hacia las espectaculares colinas cubiertas de selva de la Fila Costeña, Uvita ofrece una rica variedad de microclimates y opciones residenciales. Ya sea que desee vivir a pocos pasos de la suave arena dentro de la zona marítima o prefiera ascender 200 metros por las colinas para disfrutar de constantes brisas marinas y vistas espectaculares del atardecer sobre la Cola de Ballena, Uvita ofrece la experiencia costera definitiva.

### Bienes Raíces Costeros de Alta Gama: Dónde Invertir

El mercado inmobiliario de Uvita es uno de los de más rápido crecimiento y más robustos de Centroamérica. Las propiedades son muy diversas, segmentadas por elevación, cercanía a la playa y potencial de alquiler.

\`\`\`
                           LAS COLINAS DE HERMOSA Y SAN MARTIN
             (Eco-Mansiones Contemporáneas, Piscinas Infinitas, Vista 180° Cola Ballena)
                                             ▲
                                             │ (10 min)
                                             ▼
                              CENTRO COMERCIAL DE UVITA
               (Supermercados Gourmet, Bancos, Colegios Bilingües, Clínicas)
                                             ▲
                      ┌──────────────────────┴──────────────────────┐
                      │ (5 min)                                     │ (5 min)
                      ▼                                             ▼
          PARQUE NACIONAL MARINO BALLENA                       PLAYA HERMOSA
          (Playa Cola de Ballena, Ballenas, Arrecifes)        (Costa de Surf, Atardeceres)
\`\`\`

1. **Las Colinas de Hermosa y San Martín**
* **El Ambiente**: Lujo de élite y escala espectacular. Estas empinadas colinas cubiertas de bosque primario se elevan directamente detrás de Playa Hermosa y Uvita, ofreciendo vistas inigualables de la Cola de Ballena y el infinito horizonte del Pacífico.
* **Tipos de Propiedad**: Masterpieces arquitectónicas de millones de dólares en vidrio y acero de diseño contemporáneo, casas inteligentes de lujo con amplias piscinas infinitas y lotes en las cumbres con amplias terrazas listas para construir y acceso controlado seguro.

2. **Centro de Uvita y Planicies**
* **El Ambiente**: Altamente transitable, activo y conveniente. Cerca de todos los servicios diarios, restaurantes y colegios.
* **Tipos de Propiedad**: Casas familiares modernas con piscina privada, comunidades de townhomes cerradas perfectas para familias expatriadas y propiedades de alquiler vacacional seguras y de alto rendimiento.

3. **Playa Bahía Ballena (Zona del Parque Nacional)**
* **El Ambiente**: Relajado, costero y enfocado en la naturaleza. A poca distancia a pie o en bicicleta de la entrada del Parque Nacional Marino Ballena.
* **Tipos de Propiedad**: Ecoalbergues y eco-villas integradas en la selva, hoteles boutique altamente lucrativos y raras propiedades en concesión en las proximidades del parque nacional.

4. **Comunidades con Vista a la Cola de Ballena**
* **El Ambiente**: Vida residencial de lujo segura y de ambiente comunitario. Colinas elevadas con vistas panorámicas al océano y áreas comunes en la jungla.
* **Tipos de Propiedad**: Casas de lujo personalizadas construidas con maderas locales y materiales sostenibles, que ofrecen conexiones legales de agua (ASADA) e internet de fibra óptica de alta velocidad.

### Clima y Economía de Mercado: Patrones Climáticos y Niveles de Propiedad

Invertir en Uvita ofrece una combinación excepcional de calidad de vida y sólidos rendimientos financieros. Como el centro comercial de la Costa Ballena, Uvita experimenta una demanda turística constante durante todo el año, lo que garantiza tarifas de alquiler vacacional premium y altos porcentajes de ocupación.

**El Microclima y el Cálido Confort Costero**

Uvita disfruta de un clima tropical de playa con una temperatura promedio de 24°C a 32°C (75°F a 90°F). Mientras que las tierras bajas reciben el sol costero y brisas marinas agradables, ascender solo 100 a 200 metros por la colina crea un descenso térmico sumamente refrescante. El aire fresco de la montaña que fluye por las colinas por la noche reduce la necesidad de aire acondicionado, brindando un perfecto equilibrio climático natural.

**Niveles de Precios de Propiedades y Panorama de Inversión**

El mercado de propiedades está altamente estructurado, ofreciendo diversos puntos de entrada con un potencial de retorno de inversión excepcionalmente alto:

| Nivel de Inversión | Rango de Precios (USD) | Ubicaciones Dominantes | Características Clave de las Propiedades |
| --- | --- | --- | --- |
| Eco-Mansiones Contemporáneas Élite | $1,200,000 – $3,500,000+ | Colinas de Hermosa, San Martín | Casas inteligentes de ultra lujo, piscinas infinitas, vistas de 180° a la Cola de Ballena, privacidad absoluta. |
| Casas Familiares y Villas Modernas | $550,000 – $950,000 | Planicie de Uvita, Bahía | Construcciones personalizadas de 3-4 habitaciones, piscinas privadas, jardines tropicales, cerca de escuelas y servicios. |
| Alquileres Vacacionales de Alta Rentabilidad | $450,000 – $850,000 | Centro de Uvita, Bahía Ballena | Villas llave en mano de 2-3 habitaciones, historial de alquiler comprobado, cerca de la playa, piscinas privadas, fibra óptica. |
| Terrenos Premium con Vista al Mar | $180,000 – $450,000 | Colinas Elevadas, Comunidades | Terrazas de construcción con vistas espectaculares, agua legal (ASADA), accesos internos e infraestructura eléctrica lista. |

### Infraestructura Estratégica y Conectividad Logística

Uvita es el centro logístico indiscutible del Pacífico Sur:
* **La Carretera Costanera**: Una autopista costera de primer nivel que proporciona una conexión rápida y pavimentada hacia el norte a Quepos (con su aeropuerto regional) y Manuel Antonio en solo 45 minutos, y al Aeropuerto Internacional SJO en 3.5 horas.
* **Excelentes Servicios Diarios**: El pueblo cuenta con múltiples bancos principales, farmacias, supermercados gourmet, ferreterías modernas y los centros médicos privados más prestigiosos de la Costa Ballena.
* **Rendimiento de Alquiler de Alta Gama**: Con dos temporadas anuales de avistamiento de ballenas (de diciembre a abril y de julio a octubre), Uvita mantiene una ocupación de alquiler vacacional excepcionalmente alta durante todo el año, lo que la convierte en una opción sumamente atractiva para inversionistas de ingresos pasivos.

### Encuentre su Propiedad con RE/MAX Altitud

Ya sea que su objetivo sea una obra maestra arquitectónica moderna en lo alto de una colina exclusiva con vista al océano y a la Cola de Ballena, una villa familiar moderna cerca de escuelas bilingües, o una propiedad llave en mano de alto rendimiento cerca del parque nacional, nuestro equipo en RE/MAX Altitud en Uvita es su principal autoridad local. Nos especializamos en conectar a familias internacionales, ejecutivos remotos e inversionistas de lujo con propiedades que elevan su estilo de vida y aseguran su futuro.

[CTA_BUTTON]`;

const metadata = {
  h1En: "The Coastal Hub of the South Pacific: Discover Uvita & Bahía Ballena, Costa Rica",
  h1Es: "El Centro Costero del Pacífico Sur: Descubra Uvita y Bahía Ballena, Costa Rica",
  seoTitleEn: "Real Estate & Homes for Sale in Uvita & Bahía Ballena | RE/MAX Altitud",
  seoTitleEs: "Bienes Raíces y Casas en Venta en Uvita y Bahía Ballena | RE/MAX Altitud",
  seoDescriptionEn:
    "Explore real estate in Uvita and Bahía Ballena. Discover beach-side villas, oceanview estates on the Hermosa ridges, and luxury homes near the Marino Ballena Whale Tail.",
  seoDescriptionEs:
    "Explore bienes raíces en Uvita y Bahía Ballena. Descubra villas cerca de la playa, quintas con vista al mar y casas de lujo cerca de la Cola de Ballena.",
  elevation: "0 m – 200 m (0 ft – 650 ft)",
  climate: "24°C – 32°C (75°F – 90°F)",
  altitudeEn: "0 m – 200 m (0 ft – 650 ft)",
  altitudeEs: "0 m – 200 m (0 ft – 650 ft)",
  tempEn: "24°C – 32°C (75°F – 90°F)",
  tempEs: "24°C – 32°C (75°F – 90°F)",
  nearestAirport: "Quepos Airport (XQP) — 45 min / San José (SJO) — 3.5 hours",
  nearestHospital: "Hospital de Osa (Cortés) — 15 min / Uvita Medical Centers — 2 min",
  nearestBeach: "Playa Uvita (Marino Ballena) — 5 min",
  investmentContext: {
    appreciationTrend:
      "Solid 8-12% annual appreciation over 5 years driven by booming tourism and expat families",
    rentalYieldEstimate: "7-11% high-yield vacation rentals and long-term expat housing",
    marketHighlights: [
      "Marino Ballena National Park & world-famous Whale Tail sandbar",
      "Exceptional commercial and service infrastructure (banks, gourmet grocery, schools)",
      "High demand for luxury vacation rentals with stable occupancy",
    ],
  },
  galleryImages: [
    {
      url: "/images/areas/uvita-gallery-1.jpg",
      captionEn: "The famous natural sandbar Whale Tail formation in Marino Ballena National Park.",
      captionEs:
        "La famosa formación natural de Cola de Ballena en el Parque Nacional Marino Ballena.",
    },
    {
      url: "/images/areas/uvita-gallery-2.jpg",
      captionEn: "Uvita Waterfall (Catarata Uvita) tucked away in the lush jungle canopy.",
      captionEs: "Catarata Uvita escondida en el exuberante dosel de la selva.",
    },
  ],
};

async function main() {
  console.log("Updating Uvita & Bahía Ballena description and metadata in database...");

  const result = await db
    .update(areas)
    .set({
      descriptionEn,
      descriptionEs,
      metadata,
    })
    .where(eq(areas.slug, "uvita"))
    .returning();

  console.log("Database update success! Updated row:", JSON.stringify(result, null, 2));

  await client.end();
}

main().catch((err) => {
  console.error("Failed to seed Uvita updates:", err);
  process.exit(1);
});
