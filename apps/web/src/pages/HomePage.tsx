import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAnalytics } from "../lib/api";
import { formatDrift, formatDuration } from "../lib/analytics-format";

export function HomePage() {
  const analytics = useQuery({
    queryKey: ["analytics", 7],
    queryFn: () => fetchAnalytics(7),
  });

  return (
    <main>
      <h1>SurfGuard</h1>
      <p>
        Create a goal, start a session, then browse with the extension connected.
      </p>
      <p>
        <Link to="/goals">Goals</Link>
        {" · "}
        <Link to="/sessions">Sessions</Link>
        {" · "}
        <Link to="/activity">Activity</Link>
        {" · "}
        <Link to="/analytics">Analytics</Link>
      </p>

      <h2>Last 7 days</h2>
      {analytics.isLoading ? <p>Loading…</p> : null}
      {analytics.isError ? (
        <p className="error">
          {analytics.error instanceof Error
            ? analytics.error.message
            : "Failed to load analytics"}
        </p>
      ) : null}
      {analytics.data ? (
        <ul className="metric-grid">
          <li>
            <span>Focus time</span>
            <strong>{formatDuration(analytics.data.overview.focusTimeMs)}</strong>
          </li>
          <li>
            <span>Productive</span>
            <strong>
              {formatDuration(analytics.data.overview.productiveTimeMs)}
            </strong>
          </li>
          <li>
            <span>Distracted</span>
            <strong>
              {formatDuration(analytics.data.overview.distractedTimeMs)}
            </strong>
          </li>
          <li>
            <span>Avg drift</span>
            <strong>
              {formatDrift(analytics.data.overview.averageDriftScore)}
            </strong>
          </li>
        </ul>
      ) : null}
    </main>
  );
}
