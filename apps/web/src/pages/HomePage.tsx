import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <h1>SurfGuard</h1>
      <p>Create a goal, start a session, then browse with the extension connected.</p>
      <p>
        <Link to="/goals">Goals</Link>
        {" · "}
        <Link to="/sessions">Sessions</Link>
        {" · "}
        <Link to="/activity">Activity</Link>
      </p>
    </main>
  );
}
