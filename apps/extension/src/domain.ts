const INTERNAL_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "devtools:",
  "brave:",
  "opera:",
  "file:",
  "moz-extension:",
]);

export function getDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (INTERNAL_PROTOCOLS.has(parsed.protocol)) return null;
    const domain = parsed.hostname.trim().toLowerCase().replace(/^www\./, "");
    if (!domain || domain === "localhost" || domain.endsWith(".localhost")) {
      return null;
    }
    return domain;
  } catch {
    return null;
  }
}
