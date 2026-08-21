/**
 * Normalizes user-provided image URLs (such as Google Drive sharing links, Dropbox, etc.)
 * into direct image binary stream URLs that browsers and Next.js Image can load.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. Google Drive Sharing Links
  // Matches:
  // - https://drive.google.com/file/d/1A2B3C.../view?usp=sharing
  // - https://drive.google.com/file/d/1A2B3C.../view
  // - https://drive.google.com/open?id=1A2B3C...
  // - https://drive.google.com/uc?id=1A2B3C...
  // - https://docs.google.com/file/d/1A2B3C...
  const gdriveRegex =
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=|thumbnail\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
  const gdriveMatch = trimmed.match(gdriveRegex);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    // High-resolution direct image thumbnail stream (up to 2000px wide)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }

  // 2. Dropbox Links: convert dl=0 to raw=1 for direct binary stream
  if (trimmed.includes("dropbox.com")) {
    const cleanUrl = trimmed.replace(/([?&])dl=[01]/, "").replace(/([?&])raw=[01]/, "");
    return cleanUrl + (cleanUrl.includes("?") ? "&raw=1" : "?raw=1");
  }

  return trimmed;
}
