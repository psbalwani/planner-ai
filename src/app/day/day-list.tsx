"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TaskOccurrence } from "@/types/database";
import { formatDayLabel } from "@/lib/dates";

export interface DayListOccurrence extends TaskOccurrence {
  tasks: { id: string; title: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  done: "Done",
  skipped: "Skipped",
  moved: "Moved",
};

export default function DayList({
  occurrences,
  movedToDateByOccurrenceId,
  movedFromDateByOccurrenceId,
}: {
  occurrences: DayListOccurrence[];
  movedToDateByOccurrenceId: Record<string, string>;
  movedFromDateByOccurrenceId: Record<string, string>;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  async function act(id: string, body: Record<string, unknown>) {
    setPendingId(id);
    await fetch(`/api/occurrences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPendingId(null);
    router.refresh();
  }

  if (occurrences.length === 0) {
    return <p className="text-sm text-muted">Nothing scheduled.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {occurrences.map((occurrence) => (
        <li
          key={occurrence.id}
          className="rounded-2xl border border-line bg-surface p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-ink">{occurrence.tasks?.title}</span>{" "}
              {occurrence.scheduled_time && (
                <span className="font-mono text-xs text-muted">{occurrence.scheduled_time}</span>
              )}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                occurrence.status === "done"
                  ? "bg-accent-soft text-accent"
                  : occurrence.status === "moved"
                    ? "bg-warm-soft text-warm"
                    : "bg-bg text-muted"
              }`}
            >
              {STATUS_LABEL[occurrence.status]}
            </span>
          </div>

          {movedFromDateByOccurrenceId[occurrence.id] && (
            <p className="mt-1 text-xs text-warm">
              ← moved from {formatDayLabel(movedFromDateByOccurrenceId[occurrence.id])}
            </p>
          )}
          {occurrence.status === "moved" && movedToDateByOccurrenceId[occurrence.id] && (
            <p className="mt-1 text-xs text-warm">
              → moved to {formatDayLabel(movedToDateByOccurrenceId[occurrence.id])}
            </p>
          )}

          {occurrence.status === "pending" && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <button
                disabled={pendingId === occurrence.id}
                onClick={() => act(occurrence.id, { action: "complete" })}
                className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                Done
              </button>
              <button
                disabled={pendingId === occurrence.id}
                onClick={() => act(occurrence.id, { action: "skip" })}
                className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
              >
                Skip
              </button>
              <input
                type="date"
                value={moveTargets[occurrence.id] ?? ""}
                onChange={(e) => setMoveTargets((prev) => ({ ...prev, [occurrence.id]: e.target.value }))}
                className="rounded-lg border border-line px-2 py-1 text-xs"
              />
              <button
                disabled={pendingId === occurrence.id || !moveTargets[occurrence.id]}
                onClick={() =>
                  act(occurrence.id, { action: "move", new_date: moveTargets[occurrence.id] })
                }
                className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                Move
              </button>
            </div>
          )}

          {(occurrence.status === "done" || occurrence.status === "skipped") && (
            <button
              disabled={pendingId === occurrence.id}
              onClick={() => act(occurrence.id, { action: "reopen" })}
              className="mt-2 text-xs text-muted underline disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
