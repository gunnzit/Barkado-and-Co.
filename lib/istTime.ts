// Barkado & Co. operates in India, so every booking time is India time
// (Asia/Kolkata, UTC+05:30, no daylight saving).
//
// The booking screens build wall-clock strings like "2026-11-11T08:00" with no
// timezone. The server runs in UTC (Vercel), and `new Date("2026-11-11T08:00")`
// there means 08:00 UTC = 1:30 PM in India, a 5½-hour shift. Always parse
// booking times through parseBookingTime() on the server.

export const IST_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/** Parses a booking time. Strings without a timezone are read as India time. */
export function parseBookingTime(value: string): Date {
  const v = value.trim();
  if (HAS_ZONE.test(v)) return new Date(v);
  // "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  const withSeconds = /T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v;
  return new Date(`${withSeconds}${IST_OFFSET}`);
}

/** Day of week (0 = Sunday) and minutes since midnight, in India time. */
export function istDayAndMinutes(date: Date): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { dayOfWeek: days.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Earliest bookable start: now plus a short lead time for the pro to get there. */
export const MIN_LEAD_MINUTES = 45;
export function isTooSoon(start: Date, now = new Date()): boolean {
  return start.getTime() < now.getTime() + MIN_LEAD_MINUTES * 60_000;
}
