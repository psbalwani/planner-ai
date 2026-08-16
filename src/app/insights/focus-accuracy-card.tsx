import type { FocusAccuracyStat } from "@/lib/focus-stats";

export default function FocusAccuracyCard({ stats }: { stats: FocusAccuracyStat[] }) {
  if (stats.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-warm">Focus accuracy</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {stats.map((stat) => (
          <li key={stat.taskId} className="text-sm text-ink">
            <span className="font-semibold">{stat.title}</span>: you plan for{" "}
            <span className="font-mono">{stat.avgPlannedMinutes}m</span> but sessions average{" "}
            <span className="font-mono">{stat.avgActualMinutes}m</span>{" "}
            <span className="text-xs text-muted">({stat.sessions} sessions)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
