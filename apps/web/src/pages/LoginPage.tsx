import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { AmbientBackdrop } from "../ui/AmbientBackdrop";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AmbientBackdrop />
      <main className="auth-main">
        <div className="auth-panel auth-panel-enter">
          <Link to="/" className="brand-mark">
            SurfGuard
          </Link>
          <h1>Sign in</h1>
          <p className="lede">Pick up where your focus session left off.</p>
          <form onSubmit={(event) => void onSubmit(event)}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="button-shine" type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p>
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
    </>
  );
}
