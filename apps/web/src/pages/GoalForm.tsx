import { useState, type FormEvent } from "react";
import { GOAL_CATEGORIES, type GoalCategory } from "@surfguard/shared";
import { type GoalFormValues } from "./goalFormValues";

type GoalFormProps = {
  initial?: GoalFormValues;
  submitLabel: string;
  onSubmit: (values: GoalFormValues) => Promise<void>;
};

const emptyValues: GoalFormValues = {
  title: "",
  description: "",
  category: "GENERAL",
  topics: "",
  keywords: "",
  isActive: true,
};

export function GoalForm({ initial, submitLabel, onSubmit }: GoalFormProps) {
  const [values, setValues] = useState<GoalFormValues>(initial ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label>
        Title
        <input
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
          required
          maxLength={200}
        />
      </label>
      <label>
        Description
        <textarea
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={4}
          maxLength={2000}
        />
      </label>
      <label>
        Category
        <select
          value={values.category}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              category: event.target.value as GoalCategory,
            }))
          }
        >
          {GOAL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Topics (comma separated)
        <input
          value={values.topics}
          onChange={(event) =>
            setValues((current) => ({ ...current, topics: event.target.value }))
          }
        />
      </label>
      <label>
        Keywords (comma separated)
        <input
          value={values.keywords}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              keywords: event.target.value,
            }))
          }
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              isActive: event.target.checked,
            }))
          }
        />
        Active
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
