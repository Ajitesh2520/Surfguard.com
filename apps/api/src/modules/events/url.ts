const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
]);

export function normalizeBrowsingUrl(
  raw: string,
): { url: string; domain: string } | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!domain) return null;

    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();

    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    let pathname = parsed.pathname;
    if (pathname.length > 1) {
      pathname = pathname.replace(/\/+$/, "");
    }

    const port =
      parsed.port && parsed.port !== "80" && parsed.port !== "443"
        ? `:${parsed.port}`
        : "";
    const search = parsed.searchParams.toString();
    const url = `${parsed.protocol}//${domain}${port}${pathname}${search ? `?${search}` : ""}`;

    return { url, domain };
  } catch {
    return null;
  }
}
