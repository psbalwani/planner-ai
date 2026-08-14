import type { TimeOfDayInsight } from "@/lib/insight";

export default function InsightCard({ insight }: { insight: TimeOfDayInsight }) {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-warm">Insight</p>
      <p className="mt-1 text-sm text-ink">
        You complete <span className="font-semibold">{insight.strongest.label.toLowerCase()}</span>-scheduled
        tasks {insight.gapPercent} points more often than{" "}
        <span className="font-semibold">{insight.weakest.label.toLowerCase()}</span>-scheduled ones.
      </p>
      <div className="mt-3 flex gap-4">
        {insight.buckets.map((bucket) => (
          <div key={bucket.label} className="flex-1">
            <div className="flex items-baseline justify-between text-xs text-muted">
              <span>{bucket.label}</span>
              <span className="font-mono">{Math.round(bucket.rate * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-bg">
              <div
                className="h-1.5 rounded-full bg-accent"
                style={{ width: `${Math.round(bucket.rate * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
