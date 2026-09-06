import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";

export function AppShell() {
  const navigate = useNavigate();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
  });

  if (me.isLoading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (me.isError || !me.data) {
    return <Navigate to="/login" replace />;
  }

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <strong>SurfGuard</strong>
        <nav className="shell-nav">
          <Link to="/">Home</Link>
          <Link to="/goals">Goals</Link>
          <Link to="/sessions">Sessions</Link>
        </nav>
        <span>{me.data.user.email}</span>
        <button type="button" onClick={() => void onLogout()}>
          Log out
        </button>
      </header>
      <Outlet />
    </div>
  );
}
