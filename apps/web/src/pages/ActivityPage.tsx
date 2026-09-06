import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../lib/api";

export function ActivityPage() {
  const events = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  return (
    <main>
      <h1>Activity</h1>
      <p>Browsing events stored for your account.</p>
      {events.isLoading ? <p>Loading…</p> : null}
      {events.isError ? (
        <p className="error">
          {events.error instanceof Error ? events.error.message : "Failed to load"}
        </p>
      ) : null}
      {events.data?.events.length === 0 ? <p>No events yet.</p> : null}
      <ul className="session-list">
        {events.data?.events.map((event) => (
          <li key={event.id}>
            <div>
              <strong>{event.title ?? event.domain}</strong>
              <div>{event.domain}</div>
            </div>
            <span>
              {event.focusSessionId ? "In session" : "No session"} ·{" "}
              {new Date(event.occurredAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
