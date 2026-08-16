"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, toErrorMessage } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

const PRESETS = [15, 25, 45];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusTimer({ tasks }: { tasks: { id: string; title: string }[] }) {
  const router = useRouter();
  const showError = useToast();
  const [taskId, setTaskId] = useState("");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [phase, setPhase] = useState<"idle" | "work" | "break">("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function countDown(onZero: () => void) {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onZero();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function start() {
    try {
      const res = await apiFetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId || undefined, duration_minutes: workMinutes }),
      });
      const { session } = await res.json();
      sessionIdRef.current = session.id;
      setPhase("work");
      setSecondsLeft(workMinutes * 60);
      countDown(finishWork);
    } catch (err) {
      showError(toErrorMessage(err));
    }
  }

  async function finishWork() {
    if (sessionIdRef.current) {
      try {
        await apiFetch(`/api/focus-sessions/${sessionIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
        router.refresh();
      } catch (err) {
        showError(toErrorMessage(err));
      }
    }
    sessionIdRef.current = null;
    const breakMinutes = workMinutes > 25 ? 10 : 5;
    setPhase("break");
    setSecondsLeft(breakMinutes * 60);
    countDown(() => setPhase("idle"));
  }

  async function stopEarly() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (sessionIdRef.current) {
      try {
        await apiFetch(`/api/focus-sessions/${sessionIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: false }),
        });
        router.refresh();
      } catch (err) {
        showError(toErrorMessage(err));
      }
    }
    sessionIdRef.current = null;
    setPhase("idle");
  }

  function skipBreak() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("idle");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      {phase === "idle" ? (
        <div className="flex flex-col items-center gap-4">
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
          >
            <option value="">No task (just focus)</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setWorkMinutes(m)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  workMinutes === m
                    ? "border-accent bg-accent text-white"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <button
            onClick={start}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Start focus session
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {phase === "work" ? "Focusing" : "Break"}
          </p>
          <p className="font-mono text-5xl font-semibold text-ink">{formatTime(secondsLeft)}</p>
          {phase === "work" ? (
            <button onClick={stopEarly} className="text-sm text-muted underline hover:text-ink">
              Stop early
            </button>
          ) : (
            <button onClick={skipBreak} className="text-sm text-muted underline hover:text-ink">
              Skip break
            </button>
          )}
        </div>
      )}
    </div>
  );
}
