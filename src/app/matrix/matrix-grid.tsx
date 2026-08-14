"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task, TaskOccurrence } from "@/types/database";
import { formatDayLabel } from "@/lib/dates";
import CheckboxToggle from "@/components/checkbox-toggle";

interface MatrixGridProps {
  tasks: Pick<Task, "id" | "title" | "default_time">[];
  days: string[];
  occurrenceByTaskAndDate: Record<string, TaskOccurrence>;
  streaksByTask: Record<string, number>;
  movedToDateByOccurrenceId: Record<string, string>;
}

function MoveIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path
        d="M2 8h9M8 4l3 4-3 4M13 3v10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MatrixGrid({
  tasks,
  days,
  occurrenceByTaskAndDate,
  streaksByTask,
  movedToDateByOccurrenceId,
}: MatrixGridProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});

  async function toggle(occurrence: TaskOccurrence) {
    setPendingId(occurrence.id);
    const action = occurrence.status === "done" ? "reopen" : "complete";
    await fetch(`/api/occurrences/${occurrence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function deleteTask(taskId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This removes all its history.`)) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  }

  async function updateTime(taskId: string, time: string) {
    setTimeOverrides((prev) => ({ ...prev, [taskId]: time }));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_time: time || null }),
    });
    router.refresh();
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
        <p className="text-sm text-ink">No recurring tasks yet.</p>
        <p className="mt-1 text-xs text-muted">
          Add one above — daily habits, weekly routines, anything you want a streak for.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted">Task</th>
            <th className="px-2 py-3 text-center font-medium text-muted">Time</th>
            {days.map((day) => (
              <th key={day} className="px-2 py-3 text-center font-mono text-xs font-normal text-muted">
                {formatDayLabel(day)}
              </th>
            ))}
            <th className="px-4 py-3 text-center font-medium text-muted">Streak</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-line">
              <td className="px-4 py-3 font-medium text-ink">
                <div className="flex items-start justify-between gap-2">
                  <span>{task.title}</span>
                  <button
                    title="Delete task"
                    onClick={() => deleteTask(task.id, task.title)}
                    className="mt-0.5 shrink-0 text-muted transition-colors hover:text-red-600"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                      <path
                        d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.5 8.5h6l.5-8.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
              <td className="px-2 py-3 text-center">
                <input
                  type="time"
                  value={timeOverrides[task.id] ?? task.default_time ?? ""}
                  onChange={(e) => updateTime(task.id, e.target.value)}
                  className="rounded-md border border-line bg-bg px-1.5 py-1 text-xs text-ink"
                />
              </td>
              {days.map((day) => {
                const occurrence = occurrenceByTaskAndDate[`${task.id}:${day}`];
                return (
                  <td key={day} className="px-2 py-3 text-center">
                    {!occurrence ? (
                      <span className="text-line">·</span>
                    ) : occurrence.status === "moved" ? (
                      <span
                        title={
                          movedToDateByOccurrenceId[occurrence.id]
                            ? `Moved to ${formatDayLabel(movedToDateByOccurrenceId[occurrence.id])}`
                            : "Moved"
                        }
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-warm"
                      >
                        <MoveIcon />
                      </span>
                    ) : (
                      <CheckboxToggle
                        checked={occurrence.status === "done"}
                        disabled={pendingId === occurrence.id}
                        onToggle={() => toggle(occurrence)}
                      />
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center font-mono font-semibold text-warm">
                {streaksByTask[task.id] ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
