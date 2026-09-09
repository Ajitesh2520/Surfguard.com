import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SESSION_STRICTNESS,
  type FocusSession,
  type SessionStrictness,
} from "@surfguard/shared";
import { fetchGoals, fetchSessions, startSession, stopSession } from "../lib/api";

const DURATION_OPTIONS = [15, 25, 45, 60, 90];

function formatClock(totalMs: number): string {
  const clamped = Math.max(0, Math.floor(totalMs / 1000));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function SessionTimer({ session }: { session: FocusSession }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsedMs = now - new Date(session.startTime).getTime();
  const plannedMs = session.plannedDurationMinutes * 60_000;
  const remainingMs = plannedMs - elapsedMs;
  const overdue = remainingMs <= 0;

  return (
    <div className="timer">
      <p className="timer-clock">{formatClock(overdue ? 0 : remainingMs)}</p>
      <p>
        Elapsed {formatClock(elapsedMs)}
        {overdue ? " · Time is up" : ""}
      </p>
    </div>
  );
}

export function SessionsPage() {
  const queryClient = useQueryClient();
  const [goalId, setGoalId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [strictness, setStrictness] = useState<SessionStrictness>("BALANCED");
  const [error, setError] = useState<string | null>(null);

  const goals = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const activeGoals = useMemo(
    () => goals.data?.goals.filter((goal) => goal.isActive) ?? [],
    [goals.data],
  );
  const activeSession = sessions.data?.sessions.find(
    (session) => session.status === "ACTIVE",
  );
  const pastSessions =
    sessions.data?.sessions.filter((session) => session.status !== "ACTIVE") ??
    [];

  useEffect(() => {
    if (!goalId && activeGoals[0]) {
      setGoalId(activeGoals[0].id);
    }
  }, [activeGoals, goalId]);

  const start = useMutation({
    mutationFn: startSession,
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const stop = useMutation({
    mutationFn: stopSession,
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const goalTitle = (id: string) =>
    goals.data?.goals.find((goal) => goal.id === id)?.title ?? id;

  return (
    <main>
      <p className="eyebrow">Live focus</p>
      <h1>Focus session</h1>
      <p className="lede">
        While a session is active, the extension classifies pages against your
        goal.
      </p>

      {activeSession ? (
        <section className="session-active">
          <p>
            Working on <strong>{goalTitle(activeSession.goalId)}</strong> ·{" "}
            <span className="status-pill">
              {activeSession.strictness.replaceAll("_", " ")}
            </span>
          </p>
          <SessionTimer session={activeSession} />
          <button
            type="button"
            className="danger"
            onClick={() => stop.mutate(activeSession.id)}
            disabled={stop.isPending}
          >
            {stop.isPending ? "Stopping…" : "Stop session"}
          </button>
        </section>
      ) : (
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!goalId) {
              setError("Select a goal");
              return;
            }
            start.mutate({
              goalId,
              durationMinutes,
              strictness,
            });
          }}
        >
          <label>
            Goal
            <select
              value={goalId}
              onChange={(event) => setGoalId(event.target.value)}
              required
            >
              {activeGoals.length === 0 ? (
                <option value="">No active goals</option>
              ) : null}
              {activeGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Duration
            <select
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
            >
              {DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Strictness
            <select
              value={strictness}
              onChange={(event) =>
                setStrictness(event.target.value as SessionStrictness)
              }
            >
              {SESSION_STRICTNESS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={start.isPending || !goalId}>
            {start.isPending ? "Starting…" : "Start session"}
          </button>
        </form>
      )}

      {error ? <p className="error">{error}</p> : null}

      <h2>Past sessions</h2>
      {pastSessions.length === 0 ? <p>No completed sessions yet.</p> : null}
      <ul className="session-list">
        {pastSessions.map((session) => (
          <li key={session.id}>
            <strong>{goalTitle(session.goalId)}</strong>
            <span>
              {session.status} · {session.strictness} ·{" "}
              {session.durationMs != null
                ? `${Math.round(session.durationMs / 60000)}m`
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
