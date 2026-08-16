"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DayOfWeek } from "@/types/database";
import { todayISO } from "@/lib/dates";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface NewRecurringTaskFormProps {
  projects: { id: string; name: string }[];
  otherTasks: { id: string; title: string }[];
}

export default function NewRecurringTaskForm({ projects, otherTasks }: NewRecurringTaskFormProps) {
  const router = useRouter();
  const showError = useToast();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || selectedDays.length === 0) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: "recurring",
          default_time: time || undefined,
          project_id: projectId || undefined,
          depends_on_task_id: dependsOnTaskId || undefined,
          recurrence: {
            frequency: "custom",
            days_of_week: selectedDays,
            start_date: todayISO(),
          },
        }),
      });
      setTitle("");
      setTime("");
      setProjectId("");
      setDependsOnTaskId("");
      setSelectedDays([]);
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
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New recurring task (e.g. Exercise)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title="Time (optional)"
          className="shrink-0 rounded-lg border border-line bg-bg px-2 py-2 text-sm text-ink"
        />
      </div>
      {(projects.length > 0 || otherTasks.length > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          {otherTasks.length > 0 && (
            <select
              value={dependsOnTaskId}
              onChange={(e) => setDependsOnTaskId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
            >
              <option value="">No dependency</option>
              {otherTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  Depends on: {task.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
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
