"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AddTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type: "one_off", scheduled_date: today }),
    });
    setTitle("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New one-off task, scheduled today"
        className="flex-1 rounded border border-neutral-300 px-3 py-2"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
