import type { AnalyticsResponse } from "@surfguard/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { formatDuration } from "./analytics-format";
import { fetchAnalytics } from "./api";

vi.mock("./api", () => ({
  fetchAnalytics: vi.fn(),
}));

const sample: AnalyticsResponse = {
  rangeDays: 7,
  overview: {
    focusTimeMs: 3_600_000,
    productiveTimeMs: 120_000,
    distractedTimeMs: 60_000,
    interventions: 2,
    blockedAttempts: 1,
    nudges: 1,
    contextSwitches: 4,
    averageDriftScore: 0.42,
    completedSessions: 3,
  },
  sessions: [
    {
      id: "s1",
      goalId: "g1",
      goalTitle: "Ship the API",
      status: "COMPLETED",
      strictness: "BALANCED",
      startTime: "2026-09-07T10:00:00.000Z",
      endTime: "2026-09-07T11:00:00.000Z",
      durationMs: 3_600_000,
    },
  ],
  timeline: [
    {
      id: "e1",
      occurredAt: "2026-09-07T10:02:00.000Z",
      domain: "instagram.com",
      title: "Instagram",
      decision: "WARN",
      durationMs: 60_000,
      driftScore: 0.4,
    },
  ],
  goals: [
    {
      goalId: "g1",
      title: "Ship the API",
      sessions: 1,
      completedSessions: 1,
      focusTimeMs: 3_600_000,
      productiveTimeMs: 120_000,
      distractedTimeMs: 60_000,
    },
  ],
  distractions: [
    {
      domain: "instagram.com",
      visits: 1,
      distractedTimeMs: 60_000,
      blocks: 0,
      nudges: 0,
    },
  ],
  interventions: [
    {
      id: "i1",
      kind: "WARN",
      message: "Stay on the goal",
      createdAt: "2026-09-07T10:02:00.000Z",
      domain: "instagram.com",
      goalTitle: "Ship the API",
    },
  ],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AnalyticsPage />
    </QueryClientProvider>,
  );
}

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(3_600_000)).toBe("1h 0m");
    expect(formatDuration(90_000)).toBe("1m 30s");
    expect(formatDuration(8_000)).toBe("8s");
  });
});

describe("AnalyticsPage", () => {
  it("renders overview and history sections", async () => {
    vi.mocked(fetchAnalytics).mockResolvedValue(sample);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Analytics" })).toBeTruthy();
    expect(await screen.findByText("Overview")).toBeTruthy();
    expect(screen.getByText("Session history")).toBeTruthy();
    expect(screen.getByText("Activity timeline")).toBeTruthy();
    expect(screen.getByText("Goal performance")).toBeTruthy();
    expect(screen.getByText("Distraction breakdown")).toBeTruthy();
    expect(screen.getByText("Intervention history")).toBeTruthy();
    expect(screen.getAllByText("Ship the API").length).toBeGreaterThan(0);
    expect(screen.getAllByText("instagram.com").length).toBeGreaterThan(0);
    expect(screen.getByText(/WARN · instagram.com/)).toBeTruthy();
  });

  it("renders empty states", async () => {
    vi.mocked(fetchAnalytics).mockResolvedValue({
      ...sample,
      overview: {
        ...sample.overview,
        focusTimeMs: 0,
        productiveTimeMs: 0,
        distractedTimeMs: 0,
        interventions: 0,
        blockedAttempts: 0,
        nudges: 0,
        contextSwitches: 0,
        averageDriftScore: 0,
        completedSessions: 0,
      },
      sessions: [],
      timeline: [],
      goals: [],
      distractions: [],
      interventions: [],
    });
    renderPage();

    expect(await screen.findByText("No sessions in this range.")).toBeTruthy();
    expect(screen.getByText("No browsing events yet.")).toBeTruthy();
    expect(screen.getByText("No goal activity in this range.")).toBeTruthy();
    expect(screen.getByText("No distractions recorded.")).toBeTruthy();
    expect(screen.getByText("No interventions in this range.")).toBeTruthy();
  });
});
