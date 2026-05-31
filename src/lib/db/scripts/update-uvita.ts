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

const descriptionEn = `## Discover Uvita & Bahía Ballena: Where Luxury Meets Untamed Paradise

Welcome to Uvita, the crown jewel of Costa Rica’s Southern Zone and the vibrant heart of Costa Ballena. Nestled where the dramatic, emerald-green mountains sweep down to meet the Pacific Ocean, Uvita offers an unparalleled lifestyle for investors, expatriates, and visionaries alike.

Famous for the iconic Whale Tail sandbar formation at the Marino Ballena National Park, this region has evolved from a serene coastal escape into one of the world's most sought-after destinations for luxury eco-living, sustainable development, and high-yielding vacation investments.

## The Uvita Lifestyle: Three Distinct Real Estate Markets

Whether you dream of waking up to 180° ocean views above the clouds, walking to a pristine surf beach, or being steps away from a thriving community, Uvita offers a micro-market tailored exactly to your vision:

### 1. High-End Mountain Living & Luxury Estates

**The Neighborhoods:** Escaleras, San Josecito, Las Brisas, and the ridges of Hermosa & San Martín.
**The Experience:** Perched on the coastal mountain ridges, these exclusive enclaves host some of the country’s most breathtaking contemporary eco-mansions. Here, privacy is absolute, the mountain breezes are refreshing, and the 180° panoramic views of the ocean, sunsets, and the Whale Tail are unmatched.
**Best For:** Discerning buyers looking for ultimate luxury, architectural masterpieces, and ultra-premium vacation rental properties.

### 2. Beachside Vibrancy & Vacation Rentals

**The Neighborhoods:** Bahía Ballena Centro, Playa Hermosa (lower), and Chamán.
**The Experience:** Life in the lower coastal flats is defined by immediate proximity to the ocean. Imagine walking or taking a short golf-cart ride straight to the golden sands of Playa Hermosa or the protected reefs of the National Park.
**Best For:** Investors targeting high-occupancy Airbnb properties, surf enthusiasts, and those who want a laid-back, car-free coastal lifestyle.

### 3. Town Convenience & Family Communities

**The Neighborhoods:** Uvita Centro, La Unión, and Calle Mariposario.
**The Experience:** Uvita is a fully-equipped, modern hub that offers seamless convenience without losing its tropical soul. The town center boasts gourmet supermarkets, banks, premium medical clinics, artisanal bakeries, and a thriving international culinary scene. It is also the epicenter for world-class alternative education models, including renowned Waldorf and bilingual schools, making it a magnet for relocating families.
**Best For:** Full-time residents, families, digital nomads, and commercial developers looking for flat, easily accessible properties.

## Why Partner with REMAX Altitud?

At REMAX Altitud, we don't just list properties; we build lifelong relationships grounded in trust, market intelligence, and deep-rooted local expertise. Navigating the Southern Zone's real estate market requires an experienced hand, and our team is uniquely positioned to guide you through every step—from finding pristine luxury land parcels to understanding local infrastructure, segregation limits, and sustainable development.

We leverage cutting-edge technology and data-driven market metrics to ensure your investment is sound, secure, and positioned for long-term appreciation.

## Your Dream in Costa Ballena Awaits

Whether you are looking to invest in a high-yield rental villa, relocate your family to a progressive community, or build your own architectural masterpiece in the jungle, Uvita is the canvas for your next chapter.

Let's start the conversation. Contact REMAX Altitud today to explore our exclusive portfolio of properties in Uvita and Bahía Ballena.

[CTA_BUTTON]`;

const descriptionEs = `## Descubra Uvita y Bahía Ballena: Donde el lujo se encuentra con el paraíso indómito

Bienvenido a Uvita, la joya de la corona de la Zona Sur de Costa Rica y el vibrante corazón de Costa Ballena. Ubicada donde las imponentes montañas de color verde esmeralda descienden majestuosamente para encontrarse con el Océano Pacífico, Uvita ofrece un estilo de vida incomparable para inversionistas, expatriados y visionarios por igual.

Famosa por la icónica formación de arena en forma de Cola de Ballena en el Parque Nacional Marino Ballena, esta región ha evolucionado de ser un sereno escape costero a convertirse en uno de los destinos más codiciados del mundo para el eco-lujo, el desarrollo sostenible y las inversiones vacacionales de alto rendimiento.

## El estilo de vida de Uvita: Tres mercados inmobiliarios distintos

Ya sea que sueñe con despertar con vistas de 180° al océano sobre las nubes, caminar hacia una playa de surf prístina o estar a pocos pasos de una próspera comunidad, Uvita ofrece un micromercado diseñado exactamente a la medida de su visión:

### 1. Vida de montaña de alta gama y propiedades de lujo

**Los Vecindarios:** Escaleras, San Josecito, Las Brisas y las colinas de Hermosa y San Martín.
**La Experiencia:** Perchados en las colinas de la cordillera costera, estos enclaves exclusivos albergan algunas de las eco-mansiones contemporáneas más impresionantes del país. Aquí, la privacidad es absoluta, las brisas de montaña son refrescantes y las vistas panorámicas de 180° al océano, los atardeceres y la Cola de Ballena son inigualables.
**Ideal Para:** Compradores exigentes que buscan el lujo supremo, obras maestras de la arquitectura y propiedades de alquiler vacacional ultra-premium.

### 2. Vibrante vida junto a la playa y alquileres vacacionales

**Los Vecindarios:** Bahía Ballena Centro, Playa Hermosa (zona baja) y Chamán.
**La Experiencia:** La vida en las planicies costeras bajas se define por la proximidad inmediata al océano. Imagine caminar o dar un corto paseo en carrito de golf directamente hacia las arenas doradas de Playa Hermosa o los arrecifes protegidos del Parque Nacional.
**Ideal Para:** Inversionistas que buscan propiedades en Airbnb con alta ocupación, entusiastas del surf y aquellos que desean un estilo de vida costero relajado y libre de automóviles.

### 3. Conveniencia del pueblo y comunidades familiares

**Los Vecindarios:** Uvita Centro, La Unión y Calle Mariposario.
**La Experiencia:** Uvita es un centro moderno y completamente equipado que ofrece una conveniencia perfecta sin perder su alma tropical. El centro del pueblo cuenta con supermercados gourmet, bancos, clínicas médicas premium, panaderías artesanales y una próspera escena culinaria internacional. También es el epicentro de modelos educativos alternativos de clase mundial, incluyendo reconocidas escuelas Waldorf y colegios bilingües, lo que lo convierte en un imán para familias que se trasladan a la zona.
**Ideal Para:** Residentes de tiempo completo, familias, nómadas digitales y desarrolladores comerciales que buscan propiedades planas y de fácil acceso.

## ¿Por qué asociarse con REMAX Altitud?

En REMAX Altitud, no solo listamos propiedades; construimos relaciones para toda la vida basadas en la confianza, la inteligencia de mercado y una profunda experiencia local. Navegar por el mercado inmobiliario de la Zona Sur requiere una mano experimentada, y nuestro equipo está en una posición única para guiarle en cada paso: desde encontrar terrenos de lujo prístinos hasta comprender la infraestructura local, los límites de segregación y el desarrollo sostenible.

Aprovechamos la tecnología de vanguardia y las métricas de mercado basadas en datos para garantizar que su inversión sea sólida, segura y esté posicionada para una valorización a largo plazo.

## Su sueño en Costa Ballena le espera

Ya sea que esté buscando invertir en una villa de alquiler de alto rendimiento, reubicar a su familia en una comunidad progresiva o construir su propia obra maestra arquitectónica en la jungla, Uvita es el lienzo para su próximo capítulo.

Comencemos la conversación. Póngase en contacto con REMAX Altitud hoy mismo para explorar nuestra exclusiva cartera de propiedades en Uvita y Bahía Ballena.

[CTA_BUTTON]`;

const metadata = {
  h1En: "The Coastal Hub of the South Pacific: Discover Uvita & Bahía Ballena, Costa Rica",
  h1Es: "El Centro Costero del Pacífico Sur: Descubra Uvita y Bahía Ballena, Costa Rica",
  seoTitleEn: "Real Estate & Homes for Sale in Uvita & Bahía Ballena | REMAX Altitud",
  seoTitleEs: "Bienes Raíces y Casas en Venta en Uvita y Bahía Ballena | REMAX Altitud",
  seoDescriptionEn:
    "Explore luxury real estate, eco-mansions, and vacation rentals in Uvita & Bahía Ballena with REMAX Altitud. Discover your paradise today.",
  seoDescriptionEs:
    "Explore bienes raíces de lujo, eco-mansiones y alquileres vacacionales en Uvita y Bahía Ballena con REMAX Altitud. Descubra su paraíso hoy.",
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
