import type { HeatmapDay } from "@/lib/stats";
import { parseISODate } from "@/lib/dates";

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-bg";
  const ratio = count / max;
  if (ratio > 0.66) return "bg-accent";
  if (ratio > 0.33) return "bg-accent/60";
  return "bg-accent/30";
}

export default function CompletionHeatmap({ days }: { days: HeatmapDay[] }) {
  if (days.length === 0) return null;
  const max = Math.max(1, ...days.map((d) => d.count));

  // Pad the front so the grid's first column starts on a Monday.
  const firstDow = parseISODate(days[0].date).getUTCDay(); // 0=Sun..6=Sat
  const leadingBlank = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (HeatmapDay | null)[] = [...Array(leadingBlank).fill(null), ...days];

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {weeks.map((week, i) => (
        <div key={i} className="flex flex-col gap-1">
          {week.map((day, j) =>
            day ? (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} completed`}
                className={`h-3 w-3 rounded-sm ${intensityClass(day.count, max)}`}
              />
            ) : (
              <div key={j} className="h-3 w-3" />
            )
          )}
        </div>
      ))}
    </div>
  );
}
