import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { areas } from "../schema/areas";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

const descriptionEn = `Elite Coastal Luxury: Discover Dominical, Costa Rica

Welcome to Dominical, the undisputed capital of high-end luxury real estate on Costa Rica’s South Pacific coast. Where neighboring areas favor a more rustic approach, Dominical represents absolute premium exclusivity; a unique coastal destination where majestic rainforest-covered mountains drop dramatically directly into the sea.

This region is a global hotspot for ultra-private luxury estates, master-crafted contemporary villas, and discerning international investors who demand uncompromising security, uncorrupted natural surroundings, and exceptional property appreciation.

### The Dominical Lifestyle: Surf, Splendor, and Absolute Sophistication

Living in Dominical means immersing yourself in a highly sophisticated, cosmopolitan beach culture. Dominated by pristine coastlines and world-class surfing waves at Playa Dominical, the town maintains a refined yet completely relaxed oceanfront energy.

The geography here is your greatest asset. Rising immediately from sea level up to 300 meters (1,000 feet) along the coastal ridges, properties here experience a brilliant combination; warm coastal beach days paired with cool, refreshing mountain breezes and infinite panoramic ocean views at night. Pristine rivers like the Barú River frame the landscape, offering private freshwater swimming holes and hidden jungle waterfalls right in your backyard.

### High-End Luxury Real Estate: Where to Invest

The Dominical real estate market is highly prestigious and tightly held. The geographical layout moves from the immediate oceanfront town center up into the elite, gated ridges of the Fila Costeña mountain range and its surrounding premier developments.

[CARDINAL_MAP]

[CARDINAL_CARDS]

### Climate & Market Economics: Weather Patterns and Property Tiers

Investing in Dominical requires understanding how geography affects both daily comfort and real estate valuations. The dramatic terrain creates distinct microclimates—where temperature and ambient moisture change based entirely on your elevation above sea level.

#### The Microclimate Advantage

Dominical enjoys a tropical climate with a reliable year-round average temperature of 22°C to 31°C (72°F to 88°F). The year is split into two primary cycles: the Dry Season (December to April), characterized by endless blue skies and brilliant Pacific sunsets, and the Green Season (May to November), when afternoon showers transform the mountains into a vibrant canopy and feed the region's iconic waterfalls.

For property buyers, elevation is everything:
* **The Coastal Zone (0–50m elevation)**: Experiences warm, sun-drenched beach days, immediate ocean access, and higher humidity—perfect for premium turn-key vacation rentals.
* **The Ridge Lines (150m–300m+ elevation)**: Areas like Escaleras and Lagunas act as natural air-conditioning. As the ocean heat rises, it hits the mountains, generating steady, refreshing thermal breezes that reduce the need for indoor cooling and keep evening temperatures incredibly crisp.

### Luxury Pricing Tiers & Investment Landscape

The Dominical market is highly exclusive, with inventory limited by strict environmental zoning and geographic boundaries. Property values are segmented into definitive asset classes:

[PRICING_TABLE]

### Unmatched Security and Strategic Logistics

While Dominical feels like an untamed tropical paradise, it features premium infrastructure and logistical connectivity:

[SERVICES_LIST]

### Find Your Property with RE/MAX Altitud Cero

Whether your goal is a modern architectural masterpiece perched high on an exclusive oceanview ridge, a turnkey luxury condo walking distance to the beach, or a hidden estate in Lagunas with its own private waterfalls, our specialized team at RE/MAX Altitud Cero in Dominical is your premier local authority. We provide discrete, expert guidance to match global investors with the region's finest properties.

[CTA_BUTTON]`;

const descriptionEs = `Elite Coastal Luxury: Descubra Dominical, Costa Rica

Bienvenido a Dominical, la capital indiscutible de bienes raíces de lujo en la costa del Pacífico Sur de Costa Rica. Mientras que las áreas vecinas favorecen un enfoque más rústico, Dominical representa una exclusividad absolutamente premium; un destino costero único donde majestuosas montañas cubiertas de selva tropical caen dramáticamente directo al mar.

Esta región es un centro de atracción mundial para propiedades de lujo ultra-privadas, villas contemporáneas de diseño y exigentes inversionistas internacionales que demandan seguridad sin concesiones, entornos naturales vírgenes y una apreciación excepcional de las propiedades.

### El estilo de vida de Dominical: Surf, esplendor y sofisticación absoluta

Vivir en Dominical significa sumergirse en una cultura de playa altamente sofisticada y cosmopolita. Dominada por costas vírgenes y olas de surf de clase mundial en Playa Dominical, el pueblo mantiene una energía frente al mar refinada pero completamente relajada.

La geografía aquí es su mayor activo. Al elevarse inmediatamente desde el nivel del mar hasta los 300 metros (1,000 pies) a lo largo de las cordilleras costeras, las propiedades experimentan una combinación brillante: días de playa cálidos combinados con brisas de montaña frescas y refrescantes, y vistas infinitas al océano por la noche. Ríos cristalinos como el Río Barú enmarcan el paisaje, ofreciendo pozas naturales de agua dulce y cascadas ocultas en la selva en su propio patio trasero.

### Bienes raíces de lujo premium: Dónde invertir

El mercado de bienes raíces de Dominical es sumamente prestigioso y exclusivo. El diseño geográfico se desplaza desde el centro urbano inmediato frente al mar hacia las cordilleras privadas y exclusivas de la Fila Costeña y sus desarrollos más destacados.

[CARDINAL_MAP]

[CARDINAL_CARDS]

### Clima y economía de mercado: Patrones climáticos y niveles de propiedad

Invertir en Dominical requiere comprender cómo la geografía afecta tanto el confort diario como las valuaciones de las propiedades. El terreno dramático crea microclimas definidos, donde la temperatura y la humedad ambiental cambian por completo según la elevación sobre el nivel del mar.

#### La ventaja del microclima

Dominical disfruta de un clima tropical con una temperatura promedio constante durante todo el año de 22°C a 31°C (72°F a 88°F). El año se divide en dos ciclos principales: la Estación Seca (de diciembre a abril), caracterizada por cielos azules infinitos y puestas de sol espectaculares sobre el Pacífico, y la Estación Verde (de mayo a noviembre), cuando las lluvias de la tarde transforman las montañas en una selva vibrante y alimentan las cascadas icónicas de la región.

Para los compradores de propiedades, la elevación lo es todo:
* **La Zona Costera (0–50m de elevación)**: Disfruta de días de playa soleados, acceso inmediato al océano y mayor humedad, ideal para propiedades vacacionales premium listas para usar.
* **Las Líneas de las Cordilleras (150m–300m+ de elevación)**: Zonas como Escaleras y Lagunas actúan como aire acondicionado natural. A medida que el calor del océano sube, choca con las montañas, generando brisas térmicas constantes y refrescantes que reducen la necesidad de refrigeración interior y mantienen las noches frescas.

### Niveles de precios de lujo y panorama de inversión

El mercado de Dominical es muy exclusivo, con un inventario limitado por una estricta zonificación ambiental y límites geográficos. El valor de las propiedades se divide en clases de activos definitivas:

[PRICING_TABLE]

### Seguridad inigualable y logística estratégica

Aunque Dominical se siente como un paraíso tropical indómito, cuenta con una infraestructura premium y una excelente conectividad logística:

[SERVICES_LIST]

### Encuentre su propiedad con RE/MAX Altitud Cero

Ya sea que su objetivo sea una obra maestra de la arquitectura moderna perched en una exclusiva cordillera con vista al mar, un condominio de lujo listo para usar a pasos de la playa, o una finca oculta en Lagunas con sus propias cascadas privadas, nuestro equipo especializado en RE/MAX Altitud Cero en Dominical es su autoridad local premier. Brindamos una guía experta y discreta para conectar a los inversionistas del mundo con las mejores propiedades de la región.

[CTA_BUTTON]`;

const metadata = {
  h1En: "Elite Coastal Luxury: Discover Dominical, Costa Rica",
  h1Es: "Elite Coastal Luxury: Descubra Dominical, Costa Rica",
  seoTitleEn: "Luxury Real Estate & Developments for Sale in Dominical | RE/MAX Altitud",
  seoTitleEs: "Bienes Raíces de Lujo y Desarrollos en Dominical | RE/MAX Altitud",
  seoDescriptionEn:
    "Explore elite coastal luxury in Dominical, Costa Rica. View property pricing tiers and microclimates across premium oceanview villas in Escaleras, Lagunas, and developments like Dulce Pacífico.",
  seoDescriptionEs:
    "Explore el lujo costero de élite en Dominical, Costa Rica. Vea niveles de precios de propiedades y microclimas en Escaleras, Lagunas y Dulce Pacífico.",
  elevation: "0 - 300m",
  climate: "Tropical / Brisas marinas",
  nearestAirport: "Quepos Airport (XQP) — 30 min / San José (SJO) — 2.5 hours",
  nearestHospital: "Hospital de Osa (Cortés) — 25 min",
  nearestBeach: "Playa Dominical / Dominicalito — Immediate",
  investmentContext: {
    appreciationTrend: "8-12% annual appreciation in prime ridges",
    rentalYieldEstimate: "6-10% net yield for beachfront and oceanview villas",
    marketHighlights: [
      "Ultra-exclusive limited inventory",
      "Stricter environmental regulations limiting supply",
      "High vacation rental demand",
    ],
  },
};

async function main() {
  console.log("Updating Dominical description and metadata in database...");

  const result = await db
    .update(areas)
    .set({
      descriptionEn,
      descriptionEs,
      metadata,
    })
    .where(eq(areas.slug, "dominical"))
    .returning();

  console.log("Database update success! Updated row:", JSON.stringify(result, null, 2));

  await client.end();
}

main().catch((err) => {
  console.error("Failed to seed Dominical updates:", err);
  process.exit(1);
});
