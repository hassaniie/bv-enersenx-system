// The app's single "today". Every date on every page is derived from it, so the
// pages agree and nothing (except scheduled "Next" runs) lands after it.
// Swap it for `new Date()` once the data comes from a live API.

/** Today, as an ISO date (UTC). */
export const TODAY = "2026-02-01"

const DAY = 86_400_000
const todayMs = Date.parse(`${TODAY}T00:00:00Z`)

export const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

/** ISO date `days` after TODAY (negative for before). */
export const daysFromToday = (days: number) => isoDate(todayMs + days * DAY)

/** Whole days from an ISO date to TODAY (positive = in the past). */
export const daysBeforeToday = (iso: string) => Math.round((todayMs - toMs(iso)) / DAY)

const today = new Date(todayMs)

/**
 * The latest complete calendar month, `back` months earlier when given:
 * 0 = the month before TODAY's month (January 2026 for TODAY = 1 Feb 2026).
 */
export function completeMonth(back = 0) {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1 - back, 1))
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
  return { start: isoDate(start.getTime()), end: isoDate(end.getTime()), year: start.getUTCFullYear(), month: start.getUTCMonth() }
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" })
const shortMonth = fmt({ month: "short" })
const longMonthYear = fmt({ month: "long", year: "numeric" })
const monthYear = fmt({ month: "short", year: "numeric" })
const dayMonth = fmt({ month: "short", day: "numeric" })
const fullDate = fmt({ month: "short", day: "2-digit", year: "numeric" })
const weekdayDayMonth = fmt({ weekday: "short", month: "short", day: "numeric" })

export const formatShortMonth = (iso: string) => shortMonth.format(toMs(iso))
/** "Jan ’26" */
export const formatMonthTick = (iso: string) => `${shortMonth.format(toMs(iso))} ’${iso.slice(2, 4)}`
export const formatMonthYear = (iso: string) => monthYear.format(toMs(iso))
export const formatLongMonthYear = (iso: string) => longMonthYear.format(toMs(iso))
export const formatDayMonth = (iso: string) => dayMonth.format(toMs(iso))
export const formatDate = (iso: string) => fullDate.format(toMs(iso))
export const formatWeekdayDayMonth = (iso: string) => weekdayDayMonth.format(toMs(iso))

/** ISO start dates of the `count` complete months ending with the latest one, oldest first. */
export const completeMonths = (count: number) =>
  Array.from({ length: count }, (_, i) => completeMonth(count - 1 - i).start)
