import {
  DEFAULT_DISTRACTING_DOMAINS,
  DEFAULT_PRODUCTIVE_DOMAINS,
  bestDomainMatch,
  normalizeDomain,
} from "@surfguard/rules";
import { SOFT_DISTRACTION_DOMAINS, type ContextEngineInput, type PageKind } from "./types";

export function classifyPage(
  domain: string,
  title: string | null | undefined,
  input: Pick<ContextEngineInput, "goal" | "preferences">,
  knownRelevant?: boolean | null,
): PageKind {
  if (knownRelevant === true) return "relevant";
  if (knownRelevant === false) return "irrelevant";

  const host = normalizeDomain(domain);
  if (!host) return "neutral";

  const allow = bestDomainMatch(host, input.preferences?.allowDomains ?? []);
  const block = bestDomainMatch(host, input.preferences?.blockDomains ?? []);
  if (block && !allow) return "irrelevant";
  if (allow && !block) return "relevant";

  if (bestDomainMatch(host, DEFAULT_PRODUCTIVE_DOMAINS)) return "relevant";
  if (bestDomainMatch(host, DEFAULT_DISTRACTING_DOMAINS)) return "irrelevant";
  if (bestDomainMatch(host, SOFT_DISTRACTION_DOMAINS)) return "irrelevant";

  const haystack = `${host} ${title ?? ""}`.toLowerCase();
  const needles = [
    ...(input.goal?.topics ?? []),
    ...(input.goal?.keywords ?? []),
    input.goal?.title ?? "",
  ]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 2);

  if (needles.some((needle) => haystack.includes(needle))) return "relevant";
  return "neutral";
}
