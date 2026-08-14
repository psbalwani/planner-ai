"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function NewOneOffTaskForm({ date }: { date: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type: "one_off",
        scheduled_date: date,
        default_time: time || undefined,
      }),
    });
    setTitle("");
    setTime("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New one-off task for this day"
        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
      />
      <div className="flex gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title="Time (optional)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-2 text-sm text-ink sm:flex-none"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
