import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";
import { AmbientBackdrop } from "../ui/AmbientBackdrop";
import { AnimatedOutlet } from "../ui/AnimatedOutlet";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/goals", label: "Goals" },
  { to: "/sessions", label: "Sessions" },
  { to: "/activity", label: "Activity" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
  });

  if (me.isLoading) {
    return (
      <>
        <AmbientBackdrop />
        <div className="loading-state">
          <div className="loading-orb" aria-hidden="true" />
          <p>Loading SurfGuard…</p>
        </div>
      </>
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
      <AmbientBackdrop />
      <header className="shell-header">
        <Link to="/" className="shell-brand">
          <span className="shell-brand-dot" aria-hidden="true" />
          SurfGuard
        </Link>
        <nav className="shell-nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shell-user">
          <span title={me.data.user.email}>{me.data.user.email}</span>
          <button type="button" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
      </header>
      <AnimatedOutlet />
    </div>
  );
}
