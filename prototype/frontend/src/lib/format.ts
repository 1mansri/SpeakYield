import { Language } from "./types";

// The mandi keeps IST hours regardless of where the phone thinks it is, so every clock
// on the board is rendered in the market's own time — not the device's.
const MANDI_TZ = "Asia/Kolkata";

const LOCALES: Record<Language, string> = {
  hi: "hi-IN",
  bn: "bn-IN",
  en: "en-IN",
};

/** A wall-clock time on the board, e.g. "10:45 am". */
export function clockTime(epochSeconds: number, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: MANDI_TZ,
    numberingSystem: "latn",
  }).format(new Date(epochSeconds * 1000));
}

/** A trading-session boundary written as "06:00" in the catalog, shown as "6:00 am". */
export function sessionTime(hhmm: string, language: Language): string {
  const [hour, minute] = hhmm.split(":").map(Number);
  const utc = Date.UTC(2000, 0, 1, hour, minute) / 1000 - 5.5 * 3600;
  return clockTime(utc, language);
}

/** The date the board is dated, e.g. "7 Aug, Fri". */
export function boardDate(epochSeconds: number, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: MANDI_TZ,
    numberingSystem: "latn",
  }).format(new Date(epochSeconds * 1000));
}

/**
 * How long ago something happened, in the farmer's language. Feed lines age while the
 * screen sits open, which is the difference between a live market and a screenshot.
 */
export function timeAgo(
  epochSeconds: number,
  t: Record<string, string>,
  now: number = Date.now(),
): string {
  const minutes = Math.max(0, Math.round((now / 1000 - epochSeconds) / 60));
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return fillTime(t.minutesAgo, minutes);
  return fillTime(t.hoursAgo, Math.round(minutes / 60));
}

function fillTime(template: string, n: number): string {
  return template.replace("{n}", String(n));
}

/** Thousands-separated for readability; the board carries a lot of four-digit numbers. */
export function grouped(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}
