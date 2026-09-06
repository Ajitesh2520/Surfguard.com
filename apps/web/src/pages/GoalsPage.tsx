import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteGoal, fetchGoals } from "../lib/api";

export function GoalsPage() {
  const queryClient = useQueryClient();
  const goals = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <main>
      <div className="page-header">
        <h1>Goals</h1>
        <Link to="/goals/new">Create goal</Link>
      </div>
      {goals.isLoading ? <p>Loading…</p> : null}
      {goals.isError ? (
        <p className="error">
          {goals.error instanceof Error ? goals.error.message : "Failed to load"}
        </p>
      ) : null}
      {goals.data?.goals.length === 0 ? (
        <p>No goals yet. Create one to get started.</p>
      ) : null}
      <ul className="goal-list">
        {goals.data?.goals.map((goal) => (
          <li key={goal.id}>
            <Link to={`/goals/${goal.id}`}>
              <strong>{goal.title}</strong>
            </Link>
            <span>
              {goal.category.replaceAll("_", " ")} ·{" "}
              {goal.isActive ? "Active" : "Inactive"}
            </span>
            <Link to={`/goals/${goal.id}/edit`}>Edit</Link>
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (confirm(`Delete “${goal.title}”?`)) {
                  remove.mutate(goal.id);
                }
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
