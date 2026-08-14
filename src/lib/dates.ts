// All dates are treated as UTC calendar dates, consistent with how
// recurring occurrences are generated in src/app/api/tasks/route.ts.
// No per-user timezone handling in v0.

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  const day = d.getUTCDay(); // Sun=0 ... Sat=6
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return toISODate(d);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDayLabel(iso: string): string {
  const d = parseISODate(iso);
  const weekday = WEEKDAY_LABELS[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${weekday} ${dd}/${mm}`;
}
