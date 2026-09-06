export function App() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  return (
    <main>
      <h1>SurfGuard</h1>
      <p>Dashboard foundation. Product features are not implemented yet.</p>
      <p>API base URL: {apiUrl}</p>
    </main>
  );
}
