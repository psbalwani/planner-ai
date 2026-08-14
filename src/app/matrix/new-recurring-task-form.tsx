"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DayOfWeek } from "@/types/database";
import { todayISO } from "@/lib/dates";

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function NewRecurringTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || selectedDays.length === 0) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type: "recurring",
        recurrence: {
          frequency: "custom",
          days_of_week: selectedDays,
          start_date: todayISO(),
        },
      }),
    });
    setTitle("");
    setSelectedDays([]);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New recurring task (e.g. Exercise)"
        className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
      />
      <div className="flex flex-wrap gap-1.5 text-xs font-mono">
        {DAYS.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => toggleDay(day)}
            className={`rounded-md border px-2.5 py-1 transition-colors ${
              selectedDays.includes(day)
                ? "border-accent bg-accent text-white"
                : "border-line text-muted hover:border-accent/50 hover:text-ink"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting || !title.trim() || selectedDays.length === 0}
        className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        Add recurring task
      </button>
    </form>
  );
}
