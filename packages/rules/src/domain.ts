export type DomainMatch = {
  pattern: string;
  kind: "exact" | "subdomain";
};

export function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "").replace(/^www\./, "");
}

export function parseHttpHost(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const host = normalizeDomain(parsed.hostname);
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

export function matchDomain(host: string, pattern: string): DomainMatch | null {
  const rule = normalizeDomain(pattern);
  if (!host || !rule) return null;
  if (host === rule) return { pattern: rule, kind: "exact" };
  if (host.endsWith(`.${rule}`)) return { pattern: rule, kind: "subdomain" };
  return null;
}

export function bestDomainMatch(
  host: string,
  patterns: readonly string[],
): DomainMatch | null {
  let best: DomainMatch | null = null;
  for (const pattern of patterns) {
    const match = matchDomain(host, pattern);
    if (!match) continue;
    if (!best || specificity(match.kind) > specificity(best.kind)) {
      best = match;
    }
  }
  return best;
}

function specificity(kind: DomainMatch["kind"]): number {
  return kind === "exact" ? 2 : 1;
}
