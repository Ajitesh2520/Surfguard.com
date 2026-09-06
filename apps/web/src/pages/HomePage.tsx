import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <h1>SurfGuard</h1>
      <p>
        Manage your focus goals. Focus sessions are not implemented yet.
      </p>
      <p>
        <Link to="/goals">View goals</Link>
      </p>
    </main>
  );
}
