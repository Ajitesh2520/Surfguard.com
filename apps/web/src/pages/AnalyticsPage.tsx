import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { AnalyticsResponse } from "@surfguard/shared";
import { fetchAnalytics } from "../lib/api";
import { formatDrift, formatDuration } from "../lib/analytics-format";
import { CountUp } from "../ui/CountUp";
import { Reveal } from "../ui/Reveal";

const RANGES = [1, 7, 30] as const;

function OverviewGrid({ data }: { data: AnalyticsResponse }) {
  const items = [
    ["Focus time", data.overview.focusTimeMs, formatDuration],
    ["Productive", data.overview.productiveTimeMs, formatDuration],
    ["Distracted", data.overview.distractedTimeMs, formatDuration],
    ["Interventions", data.overview.interventions, (n: number) => String(Math.round(n))],
    ["Blocked", data.overview.blockedAttempts, (n: number) => String(Math.round(n))],
    ["Nudges", data.overview.nudges, (n: number) => String(Math.round(n))],
    ["Context switches", data.overview.contextSwitches, (n: number) => String(Math.round(n))],
    ["Avg drift", data.overview.averageDriftScore, formatDrift],
    ["Completed sessions", data.overview.completedSessions, (n: number) => String(Math.round(n))],
  ] as const;

  return (
    <ul className="metric-grid">
      {items.map(([label, value, format], index) => (
        <Reveal as="li" key={label} delayMs={index * 45}>
          <span>{label}</span>
          <CountUp value={value} format={format} />
        </Reveal>
      ))}
    </ul>
  );
}

export function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const analytics = useQuery({
    queryKey: ["analytics", days],
    queryFn: () => fetchAnalytics(days),
  });

  return (
    <main className="analytics-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>Analytics</h1>
        </div>
        <label>
          Range
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {RANGES.map((range) => (
              <option key={range} value={range}>
                Last {range} day{range === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {analytics.isLoading ? <p>Loading…</p> : null}
      {analytics.isError ? (
        <p className="error">
          {analytics.error instanceof Error
            ? analytics.error.message
            : "Failed to load"}
        </p>
      ) : null}

      {analytics.data ? (
        <>
          <h2>Overview</h2>
          <OverviewGrid data={analytics.data} />

          <h2>Session history</h2>
          {analytics.data.sessions.length === 0 ? (
            <p>No sessions in this range.</p>
          ) : (
            <ul className="session-list">
              {analytics.data.sessions.map((session) => (
                <li key={session.id}>
                  <div>
                    <strong>{session.goalTitle}</strong>
                    <div>
                      {session.status} · {session.strictness}
                    </div>
                  </div>
                  <span>
                    {session.durationMs !== null
                      ? formatDuration(session.durationMs)
                      : "In progress"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2>Activity timeline</h2>
          {analytics.data.timeline.length === 0 ? (
            <p>No browsing events yet.</p>
          ) : (
            <ul className="session-list">
              {analytics.data.timeline.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title ?? item.domain}</strong>
                    <div>
                      {item.domain}
                      {item.decision ? ` · ${item.decision}` : ""}
                    </div>
                  </div>
                  <span>
                    {item.durationMs !== null
                      ? formatDuration(item.durationMs)
                      : "—"}{" "}
                    · {new Date(item.occurredAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2>Goal performance</h2>
          {analytics.data.goals.length === 0 ? (
            <p>No goal activity in this range.</p>
          ) : (
            <ul className="session-list">
              {analytics.data.goals.map((goal) => (
                <li key={goal.goalId}>
                  <div>
                    <strong>{goal.title}</strong>
                    <div>
                      {goal.completedSessions}/{goal.sessions} completed
                    </div>
                  </div>
                  <span>
                    Focus {formatDuration(goal.focusTimeMs)} · Dist{" "}
                    {formatDuration(goal.distractedTimeMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2>Distraction breakdown</h2>
          {analytics.data.distractions.length === 0 ? (
            <p>No distractions recorded.</p>
          ) : (
            <ul className="session-list">
              {analytics.data.distractions.map((row) => (
                <li key={row.domain}>
                  <div>
                    <strong>{row.domain}</strong>
                    <div>
                      {row.visits} visits · {row.nudges} nudges · {row.blocks}{" "}
                      blocks
                    </div>
                  </div>
                  <span>{formatDuration(row.distractedTimeMs)}</span>
                </li>
              ))}
            </ul>
          )}

          <h2>Intervention history</h2>
          {analytics.data.interventions.length === 0 ? (
            <p>No interventions in this range.</p>
          ) : (
            <ul className="session-list">
              {analytics.data.interventions.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>
                      {row.kind} · {row.domain ?? "unknown"}
                    </strong>
                    <div>{row.message ?? row.goalTitle ?? ""}</div>
                  </div>
                  <span>{new Date(row.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  );
}
