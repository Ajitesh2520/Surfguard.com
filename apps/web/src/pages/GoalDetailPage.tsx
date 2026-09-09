import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteGoal, fetchGoal } from "../lib/api";

export function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const goalQuery = useQuery({
    queryKey: ["goals", id],
    queryFn: () => fetchGoal(id ?? ""),
    enabled: Boolean(id),
  });

  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate("/goals");
    },
  });

  const goal = goalQuery.data?.goal;

  return (
    <main>
      {goalQuery.isLoading ? <p>Loading…</p> : null}
      {goalQuery.isError ? (
        <p className="error">
          {goalQuery.error instanceof Error
            ? goalQuery.error.message
            : "Goal not found"}
        </p>
      ) : null}
      {goal ? (
        <>
          <div className="page-header">
            <div>
              <p className="eyebrow">Goal</p>
              <h1>{goal.title}</h1>
            </div>
            <Link className="button ghost" to={`/goals/${goal.id}/edit`}>
              Edit
            </Link>
          </div>
          <dl className="goal-details">
            <dt>Category</dt>
            <dd>{goal.category.replaceAll("_", " ")}</dd>
            <dt>Active</dt>
            <dd>{goal.isActive ? "Yes" : "No"}</dd>
            <dt>Description</dt>
            <dd>{goal.description || "—"}</dd>
            <dt>Topics</dt>
            <dd>{goal.topics.length ? goal.topics.join(", ") : "—"}</dd>
            <dt>Keywords</dt>
            <dd>{goal.keywords.length ? goal.keywords.join(", ") : "—"}</dd>
            <dt>Created</dt>
            <dd>{new Date(goal.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt>
            <dd>{new Date(goal.updatedAt).toLocaleString()}</dd>
          </dl>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (confirm(`Delete “${goal.title}”?`)) {
                remove.mutate(goal.id);
              }
            }}
          >
            Delete goal
          </button>
        </>
      ) : null}
    </main>
  );
}
