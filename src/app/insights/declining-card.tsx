"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DecliningTaskAlert } from "@/lib/nudges";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export default function DecliningTasksCard({
  alerts,
  suggestedTime,
  suggestedLabel,
}: {
  alerts: DecliningTaskAlert[];
  suggestedTime: string | null;
  suggestedLabel: string | null;
}) {
  const router = useRouter();
  const showError = useToast();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  async function applySuggestion(taskId: string) {
    if (!suggestedTime) return;
    setApplyingId(taskId);
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_time: suggestedTime }),
      });
      router.refresh();
    } catch (err) {
      showError(toErrorMessage(err));
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-warm">Slipping</p>
      <ul className="mt-2 flex flex-col gap-3">
        {alerts.map((alert) => (
          <li key={alert.taskId} className="text-sm text-ink">
            <p>
              <span className="font-semibold">{alert.title}</span> dropped from{" "}
              {Math.round(alert.previousRate * 100)}% to {Math.round(alert.recentRate * 100)}%
              completion over the last two weeks.
            </p>
            {suggestedTime && suggestedLabel ? (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="text-muted">
                  You do better with {suggestedLabel.toLowerCase()} tasks — try {suggestedTime}?
                </span>
                <button
                  onClick={() => applySuggestion(alert.taskId)}
                  disabled={applyingId === alert.taskId}
                  className="rounded-md border border-accent px-2 py-0.5 font-medium text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
                >
                  {applyingId === alert.taskId ? "Applying…" : `Apply — set to ${suggestedTime}`}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted">Its current schedule might not be working anymore.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
