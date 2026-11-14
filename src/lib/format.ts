import { formatLongMonthYear, formatMonthYear } from "@/lib/app-date"

const int = new Intl.NumberFormat("en-US")

/** "PKR 1,234,567" */
export const formatPkr = (n: number) => `PKR ${int.format(Math.round(n))}`

/** "PKR 7.5 lakh" / "PKR 1.2 crore": how Pakistani owners talk about large sums. */
export function formatPkrShort(n: number) {
  const abs = Math.abs(n)
  if (abs >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2).replace(/\.?0+$/, "")} crore`
  if (abs >= 100_000) return `PKR ${(n / 100_000).toFixed(1).replace(/\.0$/, "")} lakh`
  return formatPkr(n)
}

export const formatInt = (n: number) => int.format(Math.round(n))

/** "2026-01" → "Jan 2026" */
export const formatBillMonth = (month: string) => formatMonthYear(`${month}-01`)
/** "2026-01" → "January 2026" */
export const formatBillMonthLong = (month: string) => formatLongMonthYear(`${month}-01`)
