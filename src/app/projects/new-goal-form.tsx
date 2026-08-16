"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export default function NewGoalForm() {
  const router = useRouter();
  const showError = useToast();
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, target_date: targetDate || undefined }),
      });
      setName("");
      setTargetDate("");
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted">New goal</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Run a marathon"
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
      />
      <input
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        title="Target date (optional)"
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
      />
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        Add goal
      </button>
    </form>
  );
}
