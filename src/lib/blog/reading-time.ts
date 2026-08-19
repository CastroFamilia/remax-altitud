/**
 * Calculate estimated reading time in minutes based on text/markdown content.
 * Average reading speed: 200 words per minute.
 */
export function getReadingTime(content: string = ""): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}
