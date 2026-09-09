import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../lib/api";
import { AmbientBackdrop } from "../ui/AmbientBackdrop";

export function RegisterPage() {
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
      await register(email, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <h1>Create account</h1>
          <p className="lede">
            Set goals, run focus sessions, and let the extension keep you on
            course.
          </p>
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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="button-shine" type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </button>
          </form>
          <p>
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </>
  );
}
