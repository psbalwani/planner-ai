import type { WeeklyRate } from "@/lib/stats";

const WIDTH = 480;
const HEIGHT = 120;
const PADDING = 8;

export default function CompletionRateLineGraph({ weeks }: { weeks: WeeklyRate[] }) {
  const resolvedCount = weeks.filter((w) => w.rate !== null).length;
  if (resolvedCount < 2) {
    return <p className="text-sm text-muted">Not enough resolved weeks yet to chart a trend.</p>;
  }

  const stepX = weeks.length > 1 ? (WIDTH - PADDING * 2) / (weeks.length - 1) : 0;
  const points = weeks.map((w, i) =>
    w.rate === null
      ? null
      : { x: PADDING + i * stepX, y: PADDING + (1 - w.rate) * (HEIGHT - PADDING * 2) }
  );

  // Only draw lines between consecutive non-null points, so weeks with no
  // data leave a visible gap instead of a misleading straight line.
  const segments: string[] = [];
  let current: string[] = [];
  for (const p of points) {
    if (p) {
      current.push(`${p.x},${p.y}`);
    } else if (current.length) {
      segments.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) segments.push(current.join(" "));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={WIDTH}
          y1={PADDING + f * (HEIGHT - PADDING * 2)}
          y2={PADDING + f * (HEIGHT - PADDING * 2)}
          className="stroke-line"
          strokeWidth={1}
        />
      ))}
      {segments.map((seg, i) => (
        <polyline
          key={i}
          points={seg}
          fill="none"
          className="stroke-accent"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {points.map(
        (p, i) => p && <circle key={i} cx={p.x} cy={p.y} r={2.5} className="fill-accent" />
      )}
    </svg>
  );
}
