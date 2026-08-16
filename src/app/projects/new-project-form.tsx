"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export default function NewProjectForm({ goals }: { goals: { id: string; name: string }[] }) {
  const router = useRouter();
  const showError = useToast();
  const [name, setName] = useState("");
  const [goalId, setGoalId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal_id: goalId || undefined }),
      });
      setName("");
      setGoalId("");
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">New project</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Training plan"
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
      />
      <select
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
      >
        <option value="">No goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        Add project
      </button>
    </form>
  );
}
