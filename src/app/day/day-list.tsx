"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TaskOccurrence } from "@/types/database";

export interface DayListOccurrence extends TaskOccurrence {
  tasks: { id: string; title: string } | null;
}

export default function DayList({ occurrences }: { occurrences: DayListOccurrence[] }) {
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
    return <p className="text-sm text-neutral-500">Nothing scheduled.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {occurrences.map((occurrence) => (
        <li key={occurrence.id} className="rounded border border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{occurrence.tasks?.title}</span>{" "}
              {occurrence.scheduled_time && (
                <span className="text-sm text-neutral-500">{occurrence.scheduled_time}</span>
              )}
            </div>
            <span className="text-xs uppercase text-neutral-400">{occurrence.status}</span>
          </div>

          {occurrence.status === "pending" && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <button
                disabled={pendingId === occurrence.id}
                onClick={() => act(occurrence.id, { action: "complete" })}
                className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50"
              >
                Done
              </button>
              <button
                disabled={pendingId === occurrence.id}
                onClick={() => act(occurrence.id, { action: "skip" })}
                className="rounded border border-neutral-300 px-2 py-1"
              >
                Skip
              </button>
              <input
                type="date"
                value={moveTargets[occurrence.id] ?? ""}
                onChange={(e) =>
                  setMoveTargets((prev) => ({ ...prev, [occurrence.id]: e.target.value }))
                }
                className="rounded border border-neutral-300 px-2 py-1"
              />
              <button
                disabled={pendingId === occurrence.id || !moveTargets[occurrence.id]}
                onClick={() =>
                  act(occurrence.id, { action: "move", new_date: moveTargets[occurrence.id] })
                }
                className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-50"
              >
                Move
              </button>
            </div>
          )}

          {(occurrence.status === "done" || occurrence.status === "skipped") && (
            <button
              disabled={pendingId === occurrence.id}
              onClick={() => act(occurrence.id, { action: "reopen" })}
              className="mt-2 text-sm text-neutral-500 underline disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
