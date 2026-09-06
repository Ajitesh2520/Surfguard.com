import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createGoal } from "../lib/api";
import { GoalForm } from "./GoalForm";
import { formValuesToPayload } from "./goalFormValues";

export function GoalCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <main>
      <h1>Create goal</h1>
      <GoalForm
        submitLabel="Create goal"
        onSubmit={async (values) => {
          const created = await createGoal(formValuesToPayload(values));
          await queryClient.invalidateQueries({ queryKey: ["goals"] });
          navigate(`/goals/${created.goal.id}`);
        }}
      />
    </main>
  );
}
