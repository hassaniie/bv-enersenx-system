// The money model (docs/design/principles.md, M1–M7). Every PKR figure a
// screen shows comes from here, so the same figure is identical everywhere.
//
// Five kinds: billed; overcharged (one-time, recoverable); avoidable (per
// month); could save (per month, estimate); saved (per month, verified).
// Home leads with three: Recoverable, Losing per month, Saved.

import { formatBillMonth } from "@/lib/format"

import { actionsNow, verifiedKinds } from "./actions"
import { listBillsNow } from "./bills"
import { latency } from "./client"
import { overcharged, recalculate } from "./tariff"
import type { Bill, Finding, Method } from "./types"

const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`
const sum = (list: number[]) => list.reduce((s, n) => s + n, 0)

/** Bills that count towards "Recoverable": the latest 12. */
export const RECOVERABLE_WINDOW = 12

export type BillMoney = {
  billId: string
  month: string
  billed: number
  /** One-time, possible overcharges on this bill. */
  overcharged: number
  /** Per month, while the cause lasts. */
  avoidable: number
  /** Per month, an estimate. */
  couldSave: number
  findings: Finding[]
}

export function billMoney(bill: Bill): BillMoney {
  const findings = recalculate(bill).findings
  const of = (k: Finding["kind"]) => sum(findings.filter((f) => f.kind === k).map((f) => f.impactPkr))
  return {
    billId: bill.id,
    month: bill.month,
    billed: bill.amountPayable,
    overcharged: overcharged(findings),
    avoidable: of("avoidable"),
    couldSave: of("estimate"),
    findings,
  }
}

export type Headline = { amount: number; method: Method }

export type SiteMoney = {
  /** One-time: possible overcharges on the latest 12 bills. */
  recoverable: Headline & { billCount: number; from?: string; to?: string }
  /** Per month: avoidable charges plus estimated savings on the latest bill, minus causes already fixed. */
  losing: Headline & { avoidable: number; couldSave: number; month?: string }
  /** Per month: savings verified on later bills. */
  saved: Headline & { actions: number }
  latest?: BillMoney
}

/** The three headline figures for a site. Synchronous, for other data-layer code. */
export function siteMoneyNow(siteId: string): SiteMoney {
  const bills = listBillsNow(siteId) // newest first
  const window = bills.slice(0, RECOVERABLE_WINDOW).map(billMoney)
  const latest = window[0]
  // Only savings verified on later bills drop out; a done-but-unverified or failed action still costs money.
  const fixed = verifiedKinds(siteId)
  const live = (latest?.findings ?? []).filter((f) => f.kind !== "overcharge" && !fixed.has(f.id.split("-").pop() as never))
  const avoidable = sum(live.filter((f) => f.kind === "avoidable").map((f) => f.impactPkr))
  const couldSave = sum(live.filter((f) => f.kind === "estimate").map((f) => f.impactPkr))
  const verified = actionsNow(siteId).filter((a) => a.status === "verified")
  const saved = sum(verified.map((a) => a.verification!.savedMonthlyPkr))
  const recoverable = sum(window.map((b) => b.overcharged))
  const from = window.at(-1)?.month
  const to = latest?.month

  return {
    latest,
    recoverable: {
      amount: recoverable,
      billCount: window.filter((b) => b.overcharged > 0).length,
      from,
      to,
      method: {
        rule: "Possible overcharges: lines billed against the tariff's rules. One-time amounts you can claim back from your DISCO.",
        lines: [
          ...window
            .filter((b) => b.overcharged > 0)
            .slice(0, 6)
            .map((b) => ({ label: formatBillMonth(b.month), value: fmt(b.overcharged) })),
          ...(window.filter((b) => b.overcharged > 0).length > 6 ? [{ label: "Earlier bills", value: fmt(sum(window.filter((b) => b.overcharged > 0).slice(6).map((b) => b.overcharged))) }] : []),
          { label: `Total, ${window.length} latest bill${window.length === 1 ? "" : "s"}`, value: fmt(recoverable) },
        ],
        note: "Marked Likely until the tariff rules are checked against the current NEPRA notification. Avoidable charges and estimates aren't included.",
      },
    },
    losing: {
      amount: avoidable + couldSave,
      avoidable,
      couldSave,
      month: latest?.month,
      method: {
        rule: "What the latest bill shows you're still paying each month that you could stop: avoidable charges plus estimated savings. Savings already verified on later bills are left out.",
        lines: [
          { label: "Avoidable charges", value: `${fmt(avoidable)} a month` },
          { label: "Could save (estimate)", value: `${fmt(couldSave)} a month` },
          { label: latest ? `From the ${formatBillMonth(latest.month)} bill` : "Latest bill", value: `${fmt(avoidable + couldSave)} a month` },
        ],
        note: "Overcharges aren't counted here: they're in Recoverable, because you can claim them back.",
      },
    },
    saved: {
      amount: saved,
      actions: verified.length,
      method: {
        rule: "Savings verified on later bills: the average of up to 3 bills before an action was done, minus the average of up to 3 after.",
        lines: verified.length
          ? verified.map((a) => ({ label: a.title, value: `${fmt(a.verification!.savedMonthlyPkr)} a month` }))
          : [{ label: "Verified actions", value: "None yet" }],
        note: "Only measured savings count; estimates never do.",
      },
    },
  }
}

export async function getSiteMoney(siteId: string): Promise<SiteMoney> {
  await latency(300)
  return siteMoneyNow(siteId)
}
