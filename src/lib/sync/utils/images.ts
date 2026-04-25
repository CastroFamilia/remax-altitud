import "server-only";

/** URL-encode the filename segment of an image URL without touching the path prefix. */
export function encodeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const lastSlash = trimmed.lastIndexOf("/");
  if (lastSlash === -1) return encodeURI(trimmed);
  const base = trimmed.slice(0, lastSlash + 1);
  const filename = trimmed.slice(lastSlash + 1);
  return base + encodeURIComponent(filename);
}

/** Split the API's pipe-delimited `Images` string and URL-encode each filename. Drops empty entries. */
export function splitAndEncodeImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(encodeImageUrl);
}
