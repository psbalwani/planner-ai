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
      className="mb-6 flex flex-col gap-3 rounded border border-neutral-200 p-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New recurring task (e.g. Exercise)"
        className="rounded border border-neutral-300 px-3 py-2"
      />
      <div className="flex flex-wrap gap-2 text-sm">
        {DAYS.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => toggleDay(day)}
            className={`rounded border px-2 py-1 ${
              selectedDays.includes(day)
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting || !title.trim() || selectedDays.length === 0}
        className="self-start rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        Add recurring task
      </button>
    </form>
  );
}
