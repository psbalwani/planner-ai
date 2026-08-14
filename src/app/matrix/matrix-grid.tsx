"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task, TaskOccurrence } from "@/types/database";
import { formatDayLabel } from "@/lib/dates";
import CheckboxToggle from "@/components/checkbox-toggle";

interface MatrixGridProps {
  tasks: Pick<Task, "id" | "title">[];
  days: string[];
  occurrenceByTaskAndDate: Record<string, TaskOccurrence>;
  streaksByTask: Record<string, number>;
  movedToDateByOccurrenceId: Record<string, string>;
  movedFromDateByOccurrenceId: Record<string, string>;
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
  movedFromDateByOccurrenceId,
}: MatrixGridProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

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

  async function move(occurrence: TaskOccurrence) {
    if (!moveTarget) return;
    setPendingId(occurrence.id);
    await fetch(`/api/occurrences/${occurrence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", new_date: moveTarget }),
    });
    setPendingId(null);
    setMovingId(null);
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
                <span className="inline-flex items-center gap-1.5">
                  {task.title}
                  <button
                    title="Delete task"
                    onClick={() => deleteTask(task.id, task.title)}
                    className="text-line transition-colors hover:text-red-600"
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
                </span>
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
                    ) : movingId === occurrence.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="date"
                          value={moveTarget}
                          onChange={(e) => setMoveTarget(e.target.value)}
                          className="w-[110px] rounded border border-line px-1 py-0.5 text-xs"
                        />
                        <button
                          disabled={!moveTarget || pendingId === occurrence.id}
                          onClick={() => move(occurrence)}
                          className="rounded bg-accent px-1.5 py-0.5 text-xs text-white disabled:opacity-50"
                        >
                          Go
                        </button>
                        <button onClick={() => setMovingId(null)} className="text-xs text-muted">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <CheckboxToggle
                          checked={occurrence.status === "done"}
                          disabled={pendingId === occurrence.id}
                          onToggle={() => toggle(occurrence)}
                        />
                        <button
                          title={
                            movedFromDateByOccurrenceId[occurrence.id]
                              ? `Moved from ${formatDayLabel(movedFromDateByOccurrenceId[occurrence.id])} — move again`
                              : "Move to another day"
                          }
                          onClick={() => {
                            setMovingId(occurrence.id);
                            setMoveTarget("");
                          }}
                          className={`transition-colors hover:text-ink ${
                            movedFromDateByOccurrenceId[occurrence.id] ? "text-warm" : "text-line"
                          }`}
                        >
                          <MoveIcon />
                        </button>
                      </div>
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
