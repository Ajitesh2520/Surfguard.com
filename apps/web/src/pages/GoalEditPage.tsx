import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGoal, updateGoal } from "../lib/api";
import { GoalForm } from "./GoalForm";
import { formValuesToPayload, goalToFormValues } from "./goalFormValues";

export function GoalEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const goalQuery = useQuery({
    queryKey: ["goals", id],
    queryFn: () => fetchGoal(id ?? ""),
    enabled: Boolean(id),
  });

  const goal = goalQuery.data?.goal;

  return (
    <main>
      <h1>Edit goal</h1>
      {goalQuery.isLoading ? <p>Loading…</p> : null}
      {goalQuery.isError ? (
        <p className="error">
          {goalQuery.error instanceof Error
            ? goalQuery.error.message
            : "Goal not found"}
        </p>
      ) : null}
      {goal ? (
        <GoalForm
          key={goal.id}
          initial={goalToFormValues(goal)}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await updateGoal(goal.id, formValuesToPayload(values));
            await queryClient.invalidateQueries({ queryKey: ["goals"] });
            navigate(`/goals/${goal.id}`);
          }}
        />
      ) : null}
    </main>
  );
}
