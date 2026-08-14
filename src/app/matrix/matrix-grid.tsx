"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task, TaskOccurrence } from "@/types/database";
import { formatDayLabel } from "@/lib/dates";

interface MatrixGridProps {
  tasks: Pick<Task, "id" | "title">[];
  days: string[];
  occurrenceByTaskAndDate: Record<string, TaskOccurrence>;
  streaksByTask: Record<string, number>;
}

export default function MatrixGrid({
  tasks,
  days,
  occurrenceByTaskAndDate,
  streaksByTask,
}: MatrixGridProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-500">No recurring tasks yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-neutral-200 p-2 text-left">Task</th>
            {days.map((day) => (
              <th
                key={day}
                className="border-b border-neutral-200 p-2 text-center font-normal text-neutral-500"
              >
                {formatDayLabel(day)}
              </th>
            ))}
            <th className="border-b border-neutral-200 p-2 text-center font-normal text-neutral-500">
              Streak
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border-b border-neutral-100 p-2 font-medium">{task.title}</td>
              {days.map((day) => {
                const occurrence = occurrenceByTaskAndDate[`${task.id}:${day}`];
                return (
                  <td key={day} className="border-b border-neutral-100 p-2 text-center">
                    {occurrence ? (
                      <input
                        type="checkbox"
                        checked={occurrence.status === "done"}
                        disabled={pendingId === occurrence.id}
                        onChange={() => toggle(occurrence)}
                      />
                    ) : (
                      <span className="text-neutral-300">·</span>
                    )}
                  </td>
                );
              })}
              <td className="border-b border-neutral-100 p-2 text-center text-neutral-500">
                {streaksByTask[task.id] ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
