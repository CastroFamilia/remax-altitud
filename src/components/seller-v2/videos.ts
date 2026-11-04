/**
 * Videos de la landing /sell, por idioma.
 *
 * Pegá aquí el ID de YouTube (ej. youtube.com/shorts/ABC123 → "ABC123").
 * Mientras un ID esté vacío (""), el reproductor muestra "Próximamente" / "Coming soon".
 */
type Locale = "es" | "en";
type VideoKey = "main" | "exclusive" | "price";

const YOUTUBE_IDS: Record<VideoKey, Record<Locale, string>> = {
  // Video principal del hero (método Altitud)
  main: { es: "", en: "" },
  // Mito 1: la exclusiva sin rehenes
  exclusive: { es: "LlWVKi9Cmgc", en: "" },
  // Mito 2: el precio se diagnostica
  price: { es: "", en: "" },
};

/** Devuelve la URL embebible de YouTube, o undefined si aún no hay video. */
export function getSellerVideoUrl(key: VideoKey, locale: string): string | undefined {
  const id = YOUTUBE_IDS[key][locale === "es" ? "es" : "en"];
  return id ? `https://www.youtube.com/embed/${id}` : undefined;
}
