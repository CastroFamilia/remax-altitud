import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a high-quality fallback hero image for an area if the database contains
 * the default broken placeholder path, while supporting custom uploaded images.
 */
export function getAreaHeroImage(heroImageUrl: string | null | undefined, region: string): string {
  if (heroImageUrl && !heroImageUrl.startsWith("/images/areas/")) {
    return heroImageUrl;
  }
  const isMountain = region === "Mountain";
  return isMountain ? "/images/home/hero-mountains.jpg" : "/images/home/hero-coast.jpg";
}

