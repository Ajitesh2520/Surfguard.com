import { useEffect, useState } from "react";

type Limits = Record<string, number>;
type Usage = Record<string, number>;

export default function Popup() {
  const [goal, setGoal] = useState("");
  const [limits, setLimits] = useState<Limits>({});
  const [usage, setUsage] = useState<Usage>({});
  const [categoryInput, setCategoryInput] = useState("");
  const [minutesInput, setMinutesInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await chrome.storage.local.get([
      "userGoal",
      "categoryLimits",
      "categoryUsage"
    ]);

    setGoal((data.userGoal as string) || "");
    setLimits((data.categoryLimits as Limits) || {});
    setUsage((data.categoryUsage as Usage) || {});
  }

  async function saveGoal() {
    await chrome.storage.local.set({ userGoal: goal });
  }

  async function addLimit() {
    if (!categoryInput || !minutesInput) return;

    const updated = {
      ...limits,
      [categoryInput]: parseInt(minutesInput) * 60000
    };

    setLimits(updated);
    await chrome.storage.local.set({ categoryLimits: updated });

    setCategoryInput("");
    setMinutesInput("");
  }

  return (
    <div className="container">
      <h1>Focus AI</h1>

      <section>
        <h2>Your Goal</h2>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Prepare for interviews"
        />
        <button onClick={saveGoal}>Save Goal</button>
      </section>

      <section>
        <h2>Add Category Limit</h2>
        <input
          placeholder="Category"
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
        />
        <input
          type="number"
          placeholder="Minutes"
          value={minutesInput}
          onChange={(e) => setMinutesInput(e.target.value)}
        />
        <button onClick={addLimit}>Add</button>
      </section>

      <section>
        <h2>Today's Usage</h2>
        {Object.keys(limits).map((cat) => (
          <div key={cat} className="usage-item">
            <strong>{cat}</strong>
            <span>
              {Math.floor((usage[cat] || 0) / 60000)}m /
              {Math.floor(limits[cat] / 60000)}m
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
