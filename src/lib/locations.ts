/**
 * ACM Locations — Shared location hierarchy for RE/MAX Altitud ecosystem.
 *
 * Source of truth: ALTITUD HUB locations.js
 * Structure: Cantón → Distrito → Poblado/Barrio
 *
 * This module is used by:
 * - Sync pipeline (resolveSubLocation) to auto-tag properties on ingest
 * - Search combobox (AreaSearchCombobox) for hierarchical area selection
 * - Property cards (getPropertyLocation) for display labels
 *
 * When RECONNECT API sends Location = "Cajón de Pérez Zeledón, San José",
 * we match "Cajón" → district slug "cajon" under parent "perez-zeledon".
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface District {
  /** URL-safe slug for the district (e.g. "cajon") */
  slug: string;
  /** Display label (e.g. "Cajón") */
  label: string;
  /** Parent area slug this district belongs to (e.g. "perez-zeledon") */
  parentSlug: string;
  /** Coordinates [lat, lng, zoom] for map centering */
  coords?: [number, number, number];
}

export interface Canton {
  /** Display label (e.g. "Pérez Zeledón") */
  label: string;
  /** Area slug used in the website (e.g. "perez-zeledon") */
  areaSlug: string;
  /** Districts within this cantón */
  districts: District[];
}

// ─── Pérez Zeledón — 12 Districts ───────────────────────────────────────────

const PZ_DISTRICTS: District[] = [
  {
    slug: "san-isidro",
    label: "San Isidro de El General",
    parentSlug: "perez-zeledon",
    coords: [9.3787, -83.7008, 14],
  },
  {
    slug: "el-general",
    label: "El General",
    parentSlug: "perez-zeledon",
    coords: [9.355, -83.655, 14],
  },
  {
    slug: "daniel-flores",
    label: "Daniel Flores",
    parentSlug: "perez-zeledon",
    coords: [9.345, -83.68, 14],
  },
  { slug: "rivas", label: "Rivas", parentSlug: "perez-zeledon", coords: [9.465, -83.685, 13] },
  {
    slug: "san-pedro",
    label: "San Pedro",
    parentSlug: "perez-zeledon",
    coords: [9.315, -83.63, 13],
  },
  {
    slug: "platanares",
    label: "Platanares",
    parentSlug: "perez-zeledon",
    coords: [9.31, -83.72, 13],
  },
  { slug: "pejibaye", label: "Pejibaye", parentSlug: "perez-zeledon", coords: [9.28, -83.59, 13] },
  { slug: "cajon", label: "Cajón", parentSlug: "perez-zeledon", coords: [9.22, -83.61, 13] },
  { slug: "baru", label: "Barú", parentSlug: "perez-zeledon", coords: [9.29, -83.81, 13] },
  {
    slug: "rio-nuevo",
    label: "Río Nuevo",
    parentSlug: "perez-zeledon",
    coords: [9.305, -83.77, 13],
  },
  { slug: "paramo", label: "Páramo", parentSlug: "perez-zeledon", coords: [9.51, -83.72, 13] },
  {
    slug: "la-amistad",
    label: "La Amistad",
    parentSlug: "perez-zeledon",
    coords: [9.31, -83.52, 12],
  },
];

// ─── Osa (Dominical–Uvita) — 6 Districts ───────────────────────────────────

const OSA_DISTRICTS: District[] = [
  {
    slug: "bahia-ballena",
    label: "Bahía Ballena",
    parentSlug: "dominical",
    coords: [9.155, -83.745, 14],
  },
  {
    slug: "puerto-cortes",
    label: "Puerto Cortés",
    parentSlug: "ojochal",
    coords: [8.96, -83.53, 13],
  },
  { slug: "palmar", label: "Palmar", parentSlug: "ojochal", coords: [8.95, -83.47, 13] },
  { slug: "sierpe", label: "Sierpe", parentSlug: "ojochal", coords: [8.87, -83.48, 13] },
  {
    slug: "piedras-blancas",
    label: "Piedras Blancas",
    parentSlug: "ojochal",
    coords: [8.78, -83.35, 13],
  },
  { slug: "bahia-drake", label: "Bahía Drake", parentSlug: "ojochal", coords: [8.7, -83.55, 13] },
];

// ─── Quepos — 4 Districts ───────────────────────────────────────────────────

const QUEPOS_DISTRICTS: District[] = [
  { slug: "quepos-centro", label: "Quepos", parentSlug: "quepos", coords: [9.431, -84.162, 14] },
  { slug: "savegre", label: "Savegre", parentSlug: "quepos", coords: [9.32, -83.91, 13] },
  { slug: "naranjito", label: "Naranjito", parentSlug: "quepos", coords: [9.41, -84.07, 13] },
  {
    slug: "manuel-antonio",
    label: "Manuel Antonio",
    parentSlug: "quepos",
    coords: [9.392, -84.14, 14],
  },
];

// ─── Full Canton Registry ───────────────────────────────────────────────────

export const ACM_CANTONS: Canton[] = [
  {
    label: "Pérez Zeledón",
    areaSlug: "perez-zeledon",
    districts: PZ_DISTRICTS,
  },
  {
    label: "Osa (Dominical–Uvita)",
    areaSlug: "dominical",
    districts: OSA_DISTRICTS,
  },
  {
    label: "Quepos",
    areaSlug: "quepos",
    districts: QUEPOS_DISTRICTS,
  },
];

// ─── Exports for convenience ────────────────────────────────────────────────

/** All districts across all cantons */
export const ALL_DISTRICTS: District[] = ACM_CANTONS.flatMap((c) => c.districts);

/** Quick slug → District lookup */
export const DISTRICT_BY_SLUG: Record<string, District> = Object.fromEntries(
  ALL_DISTRICTS.map((d) => [d.slug, d]),
);

/** Get display label for a district slug, or title-case fallback */
export function getDistrictLabel(slug: string): string {
  const d = DISTRICT_BY_SLUG[slug];
  if (d) return d.label;
  // Fallback: title-case the slug
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Get parent area slug for a district */
export function getDistrictParent(slug: string): string | null {
  return DISTRICT_BY_SLUG[slug]?.parentSlug ?? null;
}

// ─── Keyword Matching (for resolving API Location strings) ──────────────────

/**
 * Maps keyword strings → district slugs for text-based resolution.
 * Ordered longest-first so "San Isidro de El General" matches before "San Isidro".
 */
export const DISTRICT_KEYWORDS: { keyword: string; slug: string; parent: string }[] = [
  // PZ — longest first
  { keyword: "san isidro de el general", slug: "san-isidro", parent: "perez-zeledon" }, // San Isidro de El General
  { keyword: "daniel flores zavaleta", slug: "daniel-flores", parent: "perez-zeledon" }, // Daniel Flores Zavaleta
  { keyword: "san gerardo de rivas", slug: "rivas", parent: "perez-zeledon" }, // san gerardo de rivas
  { keyword: "san juan de la cruz", slug: "rio-nuevo", parent: "perez-zeledon" }, // San Juan de la Cruz
  { keyword: "barrio laboratorio", slug: "daniel-flores", parent: "perez-zeledon" }, // Barrio Laboratorio
  { keyword: "corazón de jesús", slug: "daniel-flores", parent: "perez-zeledon" }, // Corazón de Jesús
  { keyword: "juntas de pacuar", slug: "daniel-flores", parent: "perez-zeledon" }, // Juntas de Pacuar
  { keyword: "bajos de zapotal", slug: "baru", parent: "perez-zeledon" }, // Bajos de Zapotal
  { keyword: "san juan de dios", slug: "baru", parent: "perez-zeledon" }, // San Juan de Dios
  { keyword: "santa margarita", slug: "daniel-flores", parent: "perez-zeledon" }, // Santa Margarita
  { keyword: "bajos de pacuar", slug: "daniel-flores", parent: "perez-zeledon" }, // Bajos de Pacuar
  { keyword: "nueva hortensia", slug: "san-pedro", parent: "perez-zeledon" }, // Nueva Hortensia
  { keyword: "nueva santa ana", slug: "san-pedro", parent: "perez-zeledon" }, // Nueva Santa Ana
  { keyword: "villa argentina", slug: "platanares", parent: "perez-zeledon" }, // Villa Argentina
  { keyword: "piedras blancas", slug: "rio-nuevo", parent: "perez-zeledon" }, // Piedras Blancas
  { keyword: "alto macho mora", slug: "paramo", parent: "perez-zeledon" }, // Alto Macho Mora
  { keyword: "san ramón norte", slug: "paramo", parent: "perez-zeledon" }, // San Ramón Norte
  { keyword: "rise costa rica", slug: "el-general", parent: "perez-zeledon" }, // rise costa rica
  { keyword: "bajo los arias", slug: "el-general", parent: "perez-zeledon" }, // Bajo Los Arias
  { keyword: "san juan bosco", slug: "daniel-flores", parent: "perez-zeledon" }, // San Juan Bosco
  { keyword: "quebrada honda", slug: "daniel-flores", parent: "perez-zeledon" }, // Quebrada Honda
  { keyword: "calle los mora", slug: "rivas", parent: "perez-zeledon" }, // Calle Los Mora
  { keyword: "san juan norte", slug: "rivas", parent: "perez-zeledon" }, // San Juan Norte
  { keyword: "rinconada vega", slug: "san-pedro", parent: "perez-zeledon" }, // Rinconada Vega
  { keyword: "santa eduviges", slug: "paramo", parent: "perez-zeledon" }, // Santa Eduviges
  { keyword: "general viejo", slug: "el-general", parent: "perez-zeledon" }, // General Viejo
  { keyword: "nuevo general", slug: "el-general", parent: "perez-zeledon" }, // Nuevo General
  { keyword: "peñas blancas", slug: "el-general", parent: "perez-zeledon" }, // Peñas Blancas
  { keyword: "calle hidalgo", slug: "el-general", parent: "perez-zeledon" }, // Calle Hidalgo
  { keyword: "daniel flores", slug: "daniel-flores", parent: "perez-zeledon" }, // Daniel Flores
  { keyword: "patio de agua", slug: "daniel-flores", parent: "perez-zeledon" }, // Patio de Agua
  { keyword: "alto calderón", slug: "san-pedro", parent: "perez-zeledon" }, // Alto Calderón
  { keyword: "santo domingo", slug: "san-pedro", parent: "perez-zeledon" }, // Santo Domingo
  { keyword: "bajo espinoza", slug: "platanares", parent: "perez-zeledon" }, // Bajo Espinoza
  { keyword: "alto trinidad", slug: "pejibaye", parent: "perez-zeledon" }, // Alto Trinidad
  { keyword: "bajo caliente", slug: "pejibaye", parent: "perez-zeledon" }, // Bajo Caliente
  { keyword: "san cristóbal", slug: "baru", parent: "perez-zeledon" }, // San Cristóbal
  { keyword: "alto los mena", slug: "rio-nuevo", parent: "perez-zeledon" }, // Alto los Mena
  { keyword: "san ramón sur", slug: "paramo", parent: "perez-zeledon" }, // San Ramón Sur
  { keyword: "barrio nuevo", slug: "el-general", parent: "perez-zeledon" }, // Barrio Nuevo
  { keyword: "el chumpulún", slug: "el-general", parent: "perez-zeledon" }, // El Chumpulún
  { keyword: "calle guzmán", slug: "el-general", parent: "perez-zeledon" }, // Calle Guzmán
  { keyword: "linda arriba", slug: "el-general", parent: "perez-zeledon" }, // Linda Arriba
  { keyword: "san jerónimo", slug: "san-pedro", parent: "perez-zeledon" }, // San Jerónimo
  { keyword: "san juancito", slug: "san-pedro", parent: "perez-zeledon" }, // San Juancito
  { keyword: "bajo bonitas", slug: "platanares", parent: "perez-zeledon" }, // Bajo Bonitas
  { keyword: "buenos aires", slug: "platanares", parent: "perez-zeledon" }, // Buenos Aires
  { keyword: "mollejoncito", slug: "platanares", parent: "perez-zeledon" }, // Mollejoncito
  { keyword: "vista de mar", slug: "platanares", parent: "perez-zeledon" }, // Vista de Mar
  { keyword: "desamparados", slug: "pejibaye", parent: "perez-zeledon" }, // Desamparados
  { keyword: "santa teresa", slug: "cajon", parent: "perez-zeledon" }, // Santa Teresa
  { keyword: "san salvador", slug: "baru", parent: "perez-zeledon" }, // San Salvador
  { keyword: "santo cristo", slug: "baru", parent: "perez-zeledon" }, // Santo Cristo
  { keyword: "tres piedras", slug: "baru", parent: "perez-zeledon" }, // Tres Piedras
  { keyword: "la hortensia", slug: "paramo", parent: "perez-zeledon" }, // La Hortensia
  { keyword: "santa elena", slug: "el-general", parent: "perez-zeledon" }, // Santa Elena
  { keyword: "playa verde", slug: "el-general", parent: "perez-zeledon" }, // Playa Verde
  { keyword: "alto brisas", slug: "daniel-flores", parent: "perez-zeledon" }, // Alto Brisas
  { keyword: "villa ligia", slug: "daniel-flores", parent: "perez-zeledon" }, // Villa Ligia
  { keyword: "buena vista", slug: "rivas", parent: "perez-zeledon" }, // Buena Vista
  { keyword: "piedra alta", slug: "rivas", parent: "perez-zeledon" }, // Piedra Alta
  { keyword: "alto jaular", slug: "rivas", parent: "perez-zeledon" }, // Alto Jaular
  { keyword: "linda vista", slug: "rivas", parent: "perez-zeledon" }, // Linda Vista
  { keyword: "villa mills", slug: "rivas", parent: "perez-zeledon" }, // Villa Mills
  { keyword: "san pablito", slug: "platanares", parent: "perez-zeledon" }, // San Pablito
  { keyword: "barrionuevo", slug: "pejibaye", parent: "perez-zeledon" }, // Barrionuevo
  { keyword: "calientillo", slug: "pejibaye", parent: "perez-zeledon" }, // Calientillo
  { keyword: "el progreso", slug: "pejibaye", parent: "perez-zeledon" }, // El Progreso
  { keyword: "san ignacio", slug: "cajon", parent: "perez-zeledon" }, // San Ignacio
  { keyword: "san pedrito", slug: "cajon", parent: "perez-zeledon" }, // San Pedrito
  { keyword: "santa maría", slug: "cajon", parent: "perez-zeledon" }, // Santa María
  { keyword: "santa juana", slug: "baru", parent: "perez-zeledon" }, // Santa Juana
  { keyword: "villabonita", slug: "baru", parent: "perez-zeledon" }, // Villabonita
  { keyword: "santa lucía", slug: "rio-nuevo", parent: "perez-zeledon" }, // Santa Lucía
  { keyword: "santo tomás", slug: "paramo", parent: "perez-zeledon" }, // Santo Tomás
  { keyword: "pedregosito", slug: "paramo", parent: "perez-zeledon" }, // Pedregosito
  { keyword: "china kicha", slug: "la-amistad", parent: "perez-zeledon" }, // China Kicha
  { keyword: "san gabriel", slug: "la-amistad", parent: "perez-zeledon" }, // San Gabriel
  { keyword: "santa luisa", slug: "la-amistad", parent: "perez-zeledon" }, // Santa Luisa
  { keyword: "san isidro", slug: "san-isidro", parent: "perez-zeledon" }, // San Isidro
  { keyword: "el general", slug: "el-general", parent: "perez-zeledon" }, // El General
  { keyword: "el ingenio", slug: "el-general", parent: "perez-zeledon" }, // El Ingenio
  { keyword: "miraflores", slug: "el-general", parent: "perez-zeledon" }, // Miraflores
  { keyword: "santa cruz", slug: "el-general", parent: "perez-zeledon" }, // Santa Cruz
  { keyword: "la hermosa", slug: "el-general", parent: "perez-zeledon" }, // La Hermosa
  { keyword: "los chiles", slug: "daniel-flores", parent: "perez-zeledon" }, // Los Chiles
  { keyword: "crematorio", slug: "daniel-flores", parent: "perez-zeledon" }, // Crematorio
  { keyword: "loma verde", slug: "daniel-flores", parent: "perez-zeledon" }, // Loma Verde
  { keyword: "río blanco", slug: "rivas", parent: "perez-zeledon" }, // Río Blanco
  { keyword: "las playas", slug: "rivas", parent: "perez-zeledon" }, // Las Playas
  { keyword: "miravalles", slug: "rivas", parent: "perez-zeledon" }, // Miravalles
  { keyword: "macho mora", slug: "rivas", parent: "perez-zeledon" }, // Macho Mora
  { keyword: "platanares", slug: "platanares", parent: "perez-zeledon" }, // Platanares
  { keyword: "mollejones", slug: "platanares", parent: "perez-zeledon" }, // Mollejones
  { keyword: "villa flor", slug: "platanares", parent: "perez-zeledon" }, // Villa Flor
  { keyword: "bajo minas", slug: "pejibaye", parent: "perez-zeledon" }, // Bajo Minas
  { keyword: "bellavista", slug: "pejibaye", parent: "perez-zeledon" }, // Bellavista
  { keyword: "las cruces", slug: "pejibaye", parent: "perez-zeledon" }, // Las Cruces
  { keyword: "el quemado", slug: "cajon", parent: "perez-zeledon" }, // El Quemado
  { keyword: "las brisas", slug: "cajon", parent: "perez-zeledon" }, // Las Brisas
  { keyword: "navajuelar", slug: "cajon", parent: "perez-zeledon" }, // Navajuelar
  { keyword: "salitrales", slug: "cajon", parent: "perez-zeledon" }, // Salitrales
  { keyword: "platanillo", slug: "baru", parent: "perez-zeledon" }, // Platanillo
  { keyword: "alto perla", slug: "baru", parent: "perez-zeledon" }, // Alto Perla
  { keyword: "cañablanca", slug: "baru", parent: "perez-zeledon" }, // Cañablanca
  { keyword: "tinamastes", slug: "baru", parent: "perez-zeledon" }, // Tinamastes
  { keyword: "santa rosa", slug: "rio-nuevo", parent: "perez-zeledon" }, // Santa Rosa
  { keyword: "calle mora", slug: "rio-nuevo", parent: "perez-zeledon" }, // Calle Mora
  { keyword: "la purruja", slug: "rio-nuevo", parent: "perez-zeledon" }, // La Purruja
  { keyword: "chirricano", slug: "rio-nuevo", parent: "perez-zeledon" }, // Chirricano
  { keyword: "california", slug: "rio-nuevo", parent: "perez-zeledon" }, // California
  { keyword: "la amistad", slug: "la-amistad", parent: "perez-zeledon" }, // La Amistad
  { keyword: "corralillo", slug: "la-amistad", parent: "perez-zeledon" }, // Corralillo
  { keyword: "san carlos", slug: "la-amistad", parent: "perez-zeledon" }, // San Carlos
  { keyword: "las nubes", slug: "el-general", parent: "perez-zeledon" }, // Las Nubes
  { keyword: "el carril", slug: "el-general", parent: "perez-zeledon" }, // El Carril
  { keyword: "los pinos", slug: "daniel-flores", parent: "perez-zeledon" }, // Los Pinos
  { keyword: "rosa iris", slug: "daniel-flores", parent: "perez-zeledon" }, // Rosa Iris
  { keyword: "la trocha", slug: "daniel-flores", parent: "perez-zeledon" }, // La Trocha
  { keyword: "paso bote", slug: "daniel-flores", parent: "perez-zeledon" }, // Paso Bote
  { keyword: "los reyes", slug: "daniel-flores", parent: "perez-zeledon" }, // Los Reyes
  { keyword: "la ribera", slug: "daniel-flores", parent: "perez-zeledon" }, // La Ribera
  { keyword: "herradura", slug: "rivas", parent: "perez-zeledon" }, // Herradura
  { keyword: "monterrey", slug: "rivas", parent: "perez-zeledon" }, // Monterrey
  { keyword: "la piedra", slug: "rivas", parent: "perez-zeledon" }, // La Piedra
  { keyword: "la bonita", slug: "rivas", parent: "perez-zeledon" }, // La Bonita
  { keyword: "el jardín", slug: "rivas", parent: "perez-zeledon" }, // El Jardín
  { keyword: "san pedro", slug: "san-pedro", parent: "perez-zeledon" }, // San Pedro
  { keyword: "cruz roja", slug: "san-pedro", parent: "perez-zeledon" }, // Cruz Roja
  { keyword: "esperanza", slug: "san-pedro", parent: "perez-zeledon" }, // Esperanza
  { keyword: "santa ana", slug: "san-pedro", parent: "perez-zeledon" }, // Santa Ana
  { keyword: "la sierra", slug: "platanares", parent: "perez-zeledon" }, // La Sierra
  { keyword: "san pablo", slug: "platanares", parent: "perez-zeledon" }, // San Pablo
  { keyword: "camarones", slug: "baru", parent: "perez-zeledon" }, // Camarones
  { keyword: "chontales", slug: "baru", parent: "perez-zeledon" }, // Chontales
  { keyword: "tinamaste", slug: "baru", parent: "perez-zeledon" }, // Tinamaste
  { keyword: "vista mar", slug: "baru", parent: "perez-zeledon" }, // Vista Mar
  { keyword: "río nuevo", slug: "rio-nuevo", parent: "perez-zeledon" }, // Río Nuevo
  { keyword: "rio nuevo", slug: "rio-nuevo", parent: "perez-zeledon" }, // Rio Nuevo
  { keyword: "matazanos", slug: "paramo", parent: "perez-zeledon" }, // Matazanos
  { keyword: "montezuma", slug: "la-amistad", parent: "perez-zeledon" }, // Montezuma
  { keyword: "san roque", slug: "la-amistad", parent: "perez-zeledon" }, // San Roque
  { keyword: "la arepa", slug: "el-general", parent: "perez-zeledon" }, // La Arepa
  { keyword: "la linda", slug: "el-general", parent: "perez-zeledon" }, // La Linda
  { keyword: "san luis", slug: "el-general", parent: "perez-zeledon" }, // San Luis
  { keyword: "san blas", slug: "el-general", parent: "perez-zeledon" }, // San Blas
  { keyword: "palmares", slug: "daniel-flores", parent: "perez-zeledon" }, // Palmares
  { keyword: "la suiza", slug: "daniel-flores", parent: "perez-zeledon" }, // La Suiza
  { keyword: "chimirol", slug: "rivas", parent: "perez-zeledon" }, // Chimirol
  { keyword: "san josé", slug: "rivas", parent: "perez-zeledon" }, // San José
  { keyword: "palmital", slug: "rivas", parent: "perez-zeledon" }, // Palmital
  { keyword: "la bambú", slug: "rivas", parent: "perez-zeledon" }, // La Bambú
  { keyword: "el nivel", slug: "rivas", parent: "perez-zeledon" }, // El Nivel
  { keyword: "arenilla", slug: "san-pedro", parent: "perez-zeledon" }, // Arenilla
  { keyword: "san juan", slug: "san-pedro", parent: "perez-zeledon" }, // San Juan
  { keyword: "santiago", slug: "san-pedro", parent: "perez-zeledon" }, // Santiago
  { keyword: "mastatal", slug: "platanares", parent: "perez-zeledon" }, // Mastatal
  { keyword: "naranjos", slug: "platanares", parent: "perez-zeledon" }, // Naranjos
  { keyword: "pejibaye", slug: "pejibaye", parent: "perez-zeledon" }, // Pejibaye
  { keyword: "achiotal", slug: "pejibaye", parent: "perez-zeledon" }, // Achiotal
  { keyword: "delicias", slug: "pejibaye", parent: "perez-zeledon" }, // Delicias
  { keyword: "santa fe", slug: "pejibaye", parent: "perez-zeledon" }, // Santa Fe
  { keyword: "veracruz", slug: "pejibaye", parent: "perez-zeledon" }, // Veracruz
  { keyword: "los vega", slug: "cajon", parent: "perez-zeledon" }, // Los Vega
  { keyword: "mercedes", slug: "cajon", parent: "perez-zeledon" }, // Mercedes
  { keyword: "alfombra", slug: "baru", parent: "perez-zeledon" }, // Alfombra
  { keyword: "barucito", slug: "baru", parent: "perez-zeledon" }, // Barucito
  { keyword: "farallas", slug: "baru", parent: "perez-zeledon" }, // Farallas
  { keyword: "magnolia", slug: "baru", parent: "perez-zeledon" }, // Magnolia
  { keyword: "el llano", slug: "rio-nuevo", parent: "perez-zeledon" }, // El Llano
  { keyword: "el brujo", slug: "rio-nuevo", parent: "perez-zeledon" }, // El Brujo
  { keyword: "zaragoza", slug: "rio-nuevo", parent: "perez-zeledon" }, // Zaragoza
  { keyword: "valencia", slug: "paramo", parent: "perez-zeledon" }, // Valencia
  { keyword: "oratorio", slug: "la-amistad", parent: "perez-zeledon" }, // Oratorio
  { keyword: "venecia", slug: "el-general", parent: "perez-zeledon" }, // Venecia
  { keyword: "repunta", slug: "daniel-flores", parent: "perez-zeledon" }, // Repunta
  { keyword: "colonia", slug: "san-pedro", parent: "perez-zeledon" }, // Colonia
  { keyword: "fortuna", slug: "san-pedro", parent: "perez-zeledon" }, // Fortuna
  { keyword: "bolivia", slug: "platanares", parent: "perez-zeledon" }, // Bolivia
  { keyword: "bonitas", slug: "platanares", parent: "perez-zeledon" }, // Bonitas
  { keyword: "socorro", slug: "platanares", parent: "perez-zeledon" }, // Socorro
  { keyword: "florida", slug: "baru", parent: "perez-zeledon" }, // Florida
  { keyword: "savegre", slug: "rio-nuevo", parent: "perez-zeledon" }, // Savegre
  { keyword: "miramar", slug: "paramo", parent: "perez-zeledon" }, // Miramar
  { keyword: "ángeles", slug: "paramo", parent: "perez-zeledon" }, // Ángeles
  { keyword: "la paz", slug: "el-general", parent: "perez-zeledon" }, // La Paz
  { keyword: "aurora", slug: "daniel-flores", parent: "perez-zeledon" }, // Aurora
  { keyword: "percal", slug: "daniel-flores", parent: "perez-zeledon" }, // Percal
  { keyword: "canaán", slug: "rivas", parent: "perez-zeledon" }, // Canaán
  { keyword: "talari", slug: "rivas", parent: "perez-zeledon" }, // Talari
  { keyword: "chispa", slug: "rivas", parent: "perez-zeledon" }, // Chispa
  { keyword: "alaska", slug: "rivas", parent: "perez-zeledon" }, // Alaska
  { keyword: "fátima", slug: "san-pedro", parent: "perez-zeledon" }, // Fátima
  { keyword: "guaria", slug: "san-pedro", parent: "perez-zeledon" }, // Guaria
  { keyword: "laguna", slug: "san-pedro", parent: "perez-zeledon" }, // Laguna
  { keyword: "tambor", slug: "san-pedro", parent: "perez-zeledon" }, // Tambor
  { keyword: "águila", slug: "pejibaye", parent: "perez-zeledon" }, // Águila
  { keyword: "zapote", slug: "pejibaye", parent: "perez-zeledon" }, // Zapote
  { keyword: "gloria", slug: "cajon", parent: "perez-zeledon" }, // Gloria
  { keyword: "líbano", slug: "baru", parent: "perez-zeledon" }, // Líbano
  { keyword: "torito", slug: "baru", parent: "perez-zeledon" }, // Torito
  { keyword: "tumbas", slug: "baru", parent: "perez-zeledon" }, // Tumbas
  { keyword: "páramo", slug: "paramo", parent: "perez-zeledon" }, // Páramo
  { keyword: "paramo", slug: "paramo", parent: "perez-zeledon" }, // Paramo
  { keyword: "jardín", slug: "paramo", parent: "perez-zeledon" }, // Jardín
  { keyword: "la ese", slug: "paramo", parent: "perez-zeledon" }, // La Ese
  { keyword: "berlín", slug: "paramo", parent: "perez-zeledon" }, // Berlín
  { keyword: "rosas", slug: "daniel-flores", parent: "perez-zeledon" }, // Rosas
  { keyword: "rivas", slug: "rivas", parent: "perez-zeledon" }, // Rivas
  { keyword: "chuma", slug: "rivas", parent: "perez-zeledon" }, // Chuma
  { keyword: "tirrá", slug: "rivas", parent: "perez-zeledon" }, // Tirrá
  { keyword: "junta", slug: "san-pedro", parent: "perez-zeledon" }, // Junta
  { keyword: "unión", slug: "san-pedro", parent: "perez-zeledon" }, // Unión
  { keyword: "puñal", slug: "pejibaye", parent: "perez-zeledon" }, // Puñal
  { keyword: "gibre", slug: "pejibaye", parent: "perez-zeledon" }, // Gibre
  { keyword: "mesas", slug: "pejibaye", parent: "perez-zeledon" }, // Mesas
  { keyword: "minas", slug: "pejibaye", parent: "perez-zeledon" }, // Minas
  { keyword: "cajón", slug: "cajon", parent: "perez-zeledon" }, // Cajón
  { keyword: "cajon", slug: "cajon", parent: "perez-zeledon" }, // Cajon
  { keyword: "nubes", slug: "cajon", parent: "perez-zeledon" }, // Nubes
  { keyword: "pilar", slug: "cajon", parent: "perez-zeledon" }, // Pilar
  { keyword: "bajos", slug: "baru", parent: "perez-zeledon" }, // Bajos
  { keyword: "cacao", slug: "baru", parent: "perez-zeledon" }, // Cacao
  { keyword: "ceiba", slug: "baru", parent: "perez-zeledon" }, // Ceiba
  { keyword: "guabo", slug: "baru", parent: "perez-zeledon" }, // Guabo
  { keyword: "pozos", slug: "baru", parent: "perez-zeledon" }, // Pozos
  { keyword: "reina", slug: "baru", parent: "perez-zeledon" }, // Reina
  { keyword: "peje", slug: "daniel-flores", parent: "perez-zeledon" }, // Peje
  { keyword: "barú", slug: "baru", parent: "perez-zeledon" }, // Barú
  { keyword: "baru", slug: "baru", parent: "perez-zeledon" }, // Baru
  { keyword: "rise", slug: "el-general", parent: "perez-zeledon" }, // rise

  // Osa
  { keyword: "bahía ballena", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "bahia ballena", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "puerto cortés", slug: "puerto-cortes", parent: "ojochal" },
  { keyword: "puerto cortes", slug: "puerto-cortes", parent: "ojochal" },
  { keyword: "piedras blancas", slug: "piedras-blancas", parent: "ojochal" },
  { keyword: "bahía drake", slug: "bahia-drake", parent: "ojochal" },
  { keyword: "bahia drake", slug: "bahia-drake", parent: "ojochal" },
  { keyword: "sierpe", slug: "sierpe", parent: "ojochal" },
  { keyword: "palmar", slug: "palmar", parent: "ojochal" },
  // Quepos
  { keyword: "manuel antonio", slug: "manuel-antonio", parent: "quepos" },
  { keyword: "naranjito", slug: "naranjito", parent: "quepos" },
  { keyword: "savegre", slug: "savegre", parent: "quepos" },
];
