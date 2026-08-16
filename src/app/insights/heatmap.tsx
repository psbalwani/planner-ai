import type { HeatmapDay } from "@/lib/stats";
import { parseISODate } from "@/lib/dates";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface WeekColumn {
  week: (HeatmapDay | null)[];
  monthLabel: string | null; // set only on the first column of a new month
}

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

  // Flag the first column of each new month (by its first real day) so a
  // small margin can separate that month's block from the previous one,
  // without nesting nested flex groups of uneven width.
  let lastMonth = -1;
  const columns: WeekColumn[] = weeks.map((week) => {
    const firstDay = week.find((day): day is HeatmapDay => day !== null);
    const month = firstDay ? parseISODate(firstDay.date).getUTCMonth() : lastMonth;
    const isNewMonth = firstDay !== undefined && month !== lastMonth;
    if (firstDay) lastMonth = month;
    return { week, monthLabel: isNewMonth ? MONTH_LABELS[month] : null };
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] gap-0.5">
        {columns.map((column, i) => (
          <div
            key={i}
            className={`flex min-w-[6px] flex-1 flex-col gap-0.5 ${i > 0 && column.monthLabel ? "ml-1.5" : ""}`}
          >
            {column.week.map((day, j) =>
              day ? (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} completed`}
                  className={`aspect-square w-full rounded-sm ${intensityClass(day.count, max)}`}
                />
              ) : (
                <div key={j} className="aspect-square w-full" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex h-4 min-w-[520px] gap-0.5">
        {columns.map((column, i) => (
          <div
            key={i}
            className={`relative flex-1 ${i > 0 && column.monthLabel ? "ml-1.5" : ""}`}
          >
            {column.monthLabel && (
              <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] text-muted">
                {column.monthLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
