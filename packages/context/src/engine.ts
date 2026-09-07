import { normalizeDomain } from "@surfguard/rules";
import { classifyPage } from "./classify";
import type {
  ContextEngineInput,
  ContextEngineResult,
  ContextSignals,
  PageKind,
} from "./types";

const MAX_DWELL_MS = 10 * 60 * 1000;
const RAPID_DWELL_MS = 20_000;
const DEFAULT_LAST_DWELL_MS = 30_000;

type EnrichedPage = {
  domain: string;
  kind: PageKind;
  durationMs: number;
  occurredAt: number;
};

export function analyzeContext(input: ContextEngineInput): ContextEngineResult {
  const pages = enrich(input);
  if (pages.length === 0) {
    return {
      driftScore: 0,
      pattern: "focused",
      reason: "No recent browsing activity",
      signals: emptySignals(),
    };
  }

  const signals = detectSignals(pages);
  const totalTime = pages.reduce((sum, page) => sum + page.durationMs, 0);
  const offTime = pages
    .filter((page) => page.kind === "irrelevant")
    .reduce((sum, page) => sum + page.durationMs, 0);
  const driftScore = score(signals, totalTime === 0 ? 0 : offTime / totalTime);
  const pattern = patternFor(signals, driftScore);
  return {
    driftScore,
    pattern,
    reason: reasonFor(pattern, signals),
    signals,
  };
}

export function createContextEngine() {
  return { analyze: analyzeContext };
}

function enrich(input: ContextEngineInput): EnrichedPage[] {
  const sorted = [...input.activity].sort(
    (a, b) => toTime(a.occurredAt) - toTime(b.occurredAt),
  );

  return sorted.map((event, index) => {
    const next = sorted[index + 1];
    const fromTimestamps = next
      ? Math.max(0, toTime(next.occurredAt) - toTime(event.occurredAt))
      : DEFAULT_LAST_DWELL_MS;
    const durationMs = Math.min(
      event.durationMs ?? fromTimestamps,
      MAX_DWELL_MS,
    );
    return {
      domain: normalizeDomain(event.domain),
      kind: classifyPage(event.domain, event.title, input, event.relevant),
      durationMs,
      occurredAt: toTime(event.occurredAt),
    };
  });
}

function detectSignals(pages: EnrichedPage[]): ContextSignals {
  const irrelevant = pages.filter((page) => page.kind === "irrelevant");
  const offGoalStreak = tailStreak(pages, "irrelevant");
  const relevantStreak = tailStreak(pages, "relevant");
  const offGoalRatio = pages.length === 0 ? 0 : irrelevant.length / pages.length;

  return {
    offGoalStreak,
    offGoalRatio,
    repeatedOffGoalDomain: leftAndReturned(pages),
    rapidSwitching: isRapidSwitching(pages),
    increasingDistractionTime: isIncreasingDistraction(irrelevant),
    returnedToProductive:
      relevantStreak > 0 && pages.some((page) => page.kind === "irrelevant"),
    sustainedProductive: relevantStreak >= 3 && offGoalStreak === 0,
  };
}

function score(signals: ContextSignals, timeOffRatio: number): number {
  let value =
    signals.offGoalRatio * 0.25 +
    Math.min(signals.offGoalStreak / 3, 1) * 0.35 +
    timeOffRatio * 0.2;
  if (signals.repeatedOffGoalDomain) value += 0.15;
  if (signals.rapidSwitching) value += 0.15;
  if (signals.increasingDistractionTime) value += 0.15;
  if (signals.returnedToProductive) value -= 0.25;
  if (signals.sustainedProductive) value -= 0.35;
  return clamp(value);
}

function patternFor(
  signals: ContextSignals,
  driftScore: number,
): ContextEngineResult["pattern"] {
  if (signals.returnedToProductive && signals.offGoalStreak === 0) {
    return "recovering";
  }
  if (signals.offGoalStreak > 0) {
    if (
      signals.offGoalStreak >= 3 &&
      driftScore >= 0.65 &&
      (signals.increasingDistractionTime || signals.repeatedOffGoalDomain)
    ) {
      return "spiraling";
    }
    if (signals.rapidSwitching && signals.offGoalStreak < 3) {
      return "switching";
    }
    return "drifting";
  }
  if (signals.rapidSwitching && driftScore >= 0.35) return "switching";
  if (signals.sustainedProductive || driftScore < 0.3) return "focused";
  return "focused";
}

function reasonFor(
  pattern: ContextEngineResult["pattern"],
  signals: ContextSignals,
): string {
  if (pattern === "focused") {
    return signals.sustainedProductive
      ? "Sustained productive activity on goal-related sites"
      : "Recent browsing stays on-task";
  }
  if (pattern === "recovering") {
    return "Returned to goal-related content after a distraction";
  }
  if (pattern === "switching") {
    return "Rapid domain switching with little time on each page";
  }
  if (pattern === "spiraling") {
    return "Repeated distractions with increasing time off-goal";
  }
  if (signals.repeatedOffGoalDomain) {
    return "Repeated return to distracting domains";
  }
  if (signals.offGoalStreak >= 2) {
    return "Sequence of irrelevant pages after productive work";
  }
  return "Browsing is drifting away from the goal";
}

function tailStreak(pages: EnrichedPage[], kind: PageKind): number {
  let streak = 0;
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    if (pages[index]?.kind !== kind) break;
    streak += 1;
  }
  return streak;
}

function leftAndReturned(pages: EnrichedPage[]): boolean {
  const visits = new Map<string, number[]>();
  pages.forEach((page, index) => {
    if (page.kind !== "irrelevant") return;
    const list = visits.get(page.domain) ?? [];
    list.push(index);
    visits.set(page.domain, list);
  });

  for (const indexes of visits.values()) {
    if (indexes.length < 2) continue;
    const first = indexes[0];
    const last = indexes[indexes.length - 1];
    if (first === undefined || last === undefined) continue;
    if (last - first + 1 !== indexes.length) return true;
  }
  return false;
}

function isRapidSwitching(pages: EnrichedPage[]): boolean {
  if (pages.length < 4) return false;
  const unique = new Set(pages.map((page) => page.domain));
  if (unique.size < 4) return false;
  const mean =
    pages.reduce((sum, page) => sum + page.durationMs, 0) / pages.length;
  return mean < RAPID_DWELL_MS;
}

function isIncreasingDistraction(irrelevant: EnrichedPage[]): boolean {
  if (irrelevant.length < 3) return false;
  const lastThree = irrelevant.slice(-3);
  const first = lastThree[0]?.durationMs ?? 0;
  const second = lastThree[1]?.durationMs ?? 0;
  const third = lastThree[2]?.durationMs ?? 0;
  return first < second && second < third;
}

function toTime(value: string | Date): number {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(3))));
}

function emptySignals(): ContextSignals {
  return {
    offGoalStreak: 0,
    offGoalRatio: 0,
    repeatedOffGoalDomain: false,
    rapidSwitching: false,
    increasingDistractionTime: false,
    returnedToProductive: false,
    sustainedProductive: false,
  };
}
