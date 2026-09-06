import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <h1>SurfGuard</h1>
      <p>Create a goal, then start a focus session with a timer.</p>
      <p>
        <Link to="/goals">Goals</Link>
        {" · "}
        <Link to="/sessions">Sessions</Link>
      </p>
    </main>
  );
}
