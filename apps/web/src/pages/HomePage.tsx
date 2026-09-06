import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../lib/api";

export function HomePage() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  return (
    <main>
      <h1>SurfGuard</h1>
      <p>You are signed in as {me.data?.user.email ?? "…"}.</p>
      <p>Goals and focus sessions are not implemented yet.</p>
    </main>
  );
}
