import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAnalytics } from "../lib/api";
import { formatDrift, formatDuration } from "../lib/analytics-format";
import { CountUp } from "../ui/CountUp";
import { Reveal } from "../ui/Reveal";

export function HomePage() {
  const analytics = useQuery({
    queryKey: ["analytics", 7],
    queryFn: () => fetchAnalytics(7),
  });

  return (
    <main>
      <Reveal as="section" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Focus dashboard
          </p>
          <h1 className="hero-title">
            <span>Surf</span>
            <span className="hero-title-accent">Guard</span>
          </h1>
          <p className="lede">
            Create a goal, start a session, then browse with the extension
            connected. SurfGuard nudges, warns, or pauses off-goal tabs while you
            work.
          </p>
          <div className="hero-actions">
            <Link className="button button-shine" to="/sessions">
              Start a session
            </Link>
            <Link className="button ghost" to="/goals/new">
              Create a goal
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="focus-lock">
            <span className="focus-ring focus-ring-outer" />
            <span className="focus-ring focus-ring-mid" />
            <span className="focus-ring focus-ring-inner" />
            <span className="focus-bracket focus-bracket-tl" />
            <span className="focus-bracket focus-bracket-tr" />
            <span className="focus-bracket focus-bracket-bl" />
            <span className="focus-bracket focus-bracket-br" />
            <span className="focus-scan" />
            <span className="focus-latch" />
            <div className="orbit-core">
              <span className="orbit-core-shackle" />
              <span className="orbit-core-body">
                <span className="orbit-core-label">SG</span>
                <span className="orbit-core-keyhole" />
              </span>
              <span className="orbit-core-bolt" />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="quick-links" delayMs={80}>
        <Link className="chip-link" to="/goals">
          Goals
        </Link>
        <Link className="chip-link" to="/sessions">
          Sessions
        </Link>
        <Link className="chip-link" to="/activity">
          Activity
        </Link>
        <Link className="chip-link" to="/analytics">
          Analytics
        </Link>
      </Reveal>

      <Reveal delayMs={120}>
        <h2>Last 7 days</h2>
      </Reveal>
      {analytics.isLoading ? (
        <div className="skeleton-grid" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {analytics.isError ? (
        <p className="error">
          {analytics.error instanceof Error
            ? analytics.error.message
            : "Failed to load analytics"}
        </p>
      ) : null}
      {analytics.data ? (
        <ul className="metric-grid">
          <Reveal as="li" delayMs={0}>
            <span>Focus time</span>
            <CountUp
              value={analytics.data.overview.focusTimeMs}
              format={formatDuration}
            />
          </Reveal>
          <Reveal as="li" delayMs={70}>
            <span>Productive</span>
            <CountUp
              value={analytics.data.overview.productiveTimeMs}
              format={formatDuration}
            />
          </Reveal>
          <Reveal as="li" delayMs={140}>
            <span>Distracted</span>
            <CountUp
              value={analytics.data.overview.distractedTimeMs}
              format={formatDuration}
            />
          </Reveal>
          <Reveal as="li" delayMs={210}>
            <span>Avg drift</span>
            <CountUp
              value={analytics.data.overview.averageDriftScore}
              format={formatDrift}
            />
          </Reveal>
        </ul>
      ) : null}
    </main>
  );
}
