export interface IcsEvent {
  uid: string;
  title: string;
  date: string; // ISO date, "YYYY-MM-DD"
  time: string | null; // "HH:MM" or "HH:MM:SS", null for an all-day event
  durationMinutes: number | null;
}

const DEFAULT_DURATION_MINUTES = 30;

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsUtcStamp(isoUtc: string): string {
  return isoUtc.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Builds a minimal but valid RFC 5545 .ics document — one VEVENT per
// occurrence, timed if scheduled_time is set, all-day otherwise. nowUtc is
// injected (an ISO timestamp) rather than read from the clock in here, so
// this stays a pure, testable function.
export function buildIcs(events: IcsEvent[], nowUtc: string): string {
  const stamp = formatIcsUtcStamp(nowUtc);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planner AI//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    const compactDate = event.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}@planner-ai`);
    lines.push(`DTSTAMP:${stamp}`);
    if (event.time) {
      const [hours, minutes] = event.time.split(":");
      lines.push(`DTSTART:${compactDate}T${hours}${minutes}00`);
      lines.push(`DURATION:PT${event.durationMinutes ?? DEFAULT_DURATION_MINUTES}M`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
