import type { DecliningTaskAlert } from "@/lib/nudges";

export default function DecliningTasksCard({ alerts }: { alerts: DecliningTaskAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-warm">Slipping</p>
      <ul className="mt-2 flex flex-col gap-2">
        {alerts.map((alert) => (
          <li key={alert.taskId} className="text-sm text-ink">
            <span className="font-semibold">{alert.title}</span> dropped from{" "}
            {Math.round(alert.previousRate * 100)}% to {Math.round(alert.recentRate * 100)}%
            completion over the last two weeks.{" "}
            <span className="text-muted">Its current schedule might not be working anymore.</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
