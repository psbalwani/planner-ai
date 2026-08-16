"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task, TaskOccurrence } from "@/types/database";
import { formatDayLabel } from "@/lib/dates";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";
import CheckboxToggle from "@/components/checkbox-toggle";

interface MatrixGridProps {
  tasks: Pick<Task, "id" | "title" | "default_time">[];
  days: string[];
  occurrenceByTaskAndDate: Record<string, TaskOccurrence>;
  streaksByTask: Record<string, number>;
  bestStreaksByTask: Record<string, number>;
  dependsOnTitleByTaskId: Record<string, string>;
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

function FireIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 ${active ? "text-warm" : "text-line"}`}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.2}
      strokeLinejoin="round"
    >
      <path d="M8 1.3c-.3 2-2.4 3.4-2.4 6.2A2.4 2.4 0 108 5.1c1.6 1 2.4 2.7 2.4 4.4A4.4 4.4 0 113.6 9.5c0-3.3 2.4-4.8 3.1-6.6.2-.5.7-1.1 1.3-1.6Z" />
    </svg>
  );
}

export default function MatrixGrid({
  tasks,
  days,
  occurrenceByTaskAndDate,
  streaksByTask,
  bestStreaksByTask,
  dependsOnTitleByTaskId,
  movedToDateByOccurrenceId,
}: MatrixGridProps) {
  const router = useRouter();
  const showError = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});

  async function toggle(occurrence: TaskOccurrence) {
    setPendingId(occurrence.id);
    try {
      const action = occurrence.status === "done" ? "reopen" : "complete";
      await apiFetch(`/api/occurrences/${occurrence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTask(taskId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This removes all its history.`)) return;
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    }
  }

  async function updateTime(taskId: string, time: string) {
    setTimeOverrides((prev) => ({ ...prev, [taskId]: time }));
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_time: time || null }),
      });
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    }
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
                {dependsOnTitleByTaskId[task.id] && (
                  <p className="mt-0.5 text-[10px] font-normal text-muted">
                    depends on: {dependsOnTitleByTaskId[task.id]}
                  </p>
                )}
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
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <FireIcon active={(streaksByTask[task.id] ?? 0) > 0} />
                  <span
                    className={`font-mono font-semibold ${
                      (streaksByTask[task.id] ?? 0) > 0 ? "text-warm" : "text-muted"
                    }`}
                  >
                    {streaksByTask[task.id] ?? 0}
                  </span>
                </div>
                {(bestStreaksByTask[task.id] ?? 0) > (streaksByTask[task.id] ?? 0) && (
                  <p className="font-mono text-[10px] text-muted">best {bestStreaksByTask[task.id]}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
