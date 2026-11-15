// The money model (docs/design/principles.md M1–M4): one figure, one source.
// The same metric for the same bill is identical on every screen's data.
import "./setup"

import assert from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import {
  billMoney,
  getBill,
  getBillDetail,
  getSiteCost,
  getSiteMoney,
  getSiteSummary,
  listActions,
  listAlerts,
  listBillRows,
  loadScenario,
  overcharged,
  resetDemo,
} from "../src/lib/api"

const SITE = "s-rehmat-fsd"
const JAN = "bill-s-rehmat-fsd-2026-01"

describe("money model", () => {
  beforeEach(async () => {
    resetDemo()
    await loadScenario("bills-12")
  })

  it("the January bill's possible overcharge is the same on every screen", async () => {
    const jan = billMoney(await getBill(JAN)).overcharged
    assert.ok(jan > 0)

    const detail = await getBillDetail(JAN)
    assert.equal(overcharged(detail.check.findings), jan, "bill detail")

    const summary = await getSiteSummary(SITE)
    assert.equal(summary.latest?.id, JAN)
    assert.equal(overcharged(summary.check!.findings), jan, "home")

    const row = (await listBillRows(SITE)).find((r) => r.id === JAN)!
    assert.equal(row.overcharged, jan, "bills list")

    const alert = (await listAlerts(SITE)).find((a) => a.id === `al-${JAN}-errors`)!
    assert.equal(alert.impactPkr, jan, "alerts")

    const suggested = (await listActions(SITE)).filter((a) => a.status === "suggested" && (a.kind === "fixed" || a.kind === "further"))
    assert.equal(suggested.reduce((s, a) => s + a.estMonthlyPkr, 0), jan, "actions")
  })

  it("Recoverable counts only overcharges on the latest 12 bills, and matches Bills and Cost", async () => {
    const money = await getSiteMoney(SITE)
    const rows = await listBillRows(SITE)
    assert.equal(money.recoverable.amount, rows.slice(0, 12).reduce((s, r) => s + r.overcharged, 0))
    const cost = await getSiteCost(SITE)
    assert.equal(cost.kpis.find((k) => k.id === "savings")!.value, money.recoverable.amount.toLocaleString("en-US"))
  })

  it("Losing per month leaves out overcharges and causes already fixed; Saved is the verified sum", async () => {
    const money = await getSiteMoney(SITE)
    const latest = money.latest!
    // The capacitor bank was done in November, so the power factor penalty no longer counts.
    assert.equal(latest.avoidable, 0)
    assert.equal(money.losing.amount, money.losing.avoidable + money.losing.couldSave)
    assert.ok(!money.losing.method.lines.some((l) => l.label.toLowerCase().includes("overcharge")))
    const verified = (await listActions(SITE)).filter((a) => a.status === "verified")
    assert.equal(money.saved.amount, verified.reduce((s, a) => s + a.verification!.savedMonthlyPkr, 0))
    assert.ok(money.saved.amount > 0)
    // The peak shift was done but not achieved, so its estimate still counts.
    assert.equal(money.losing.couldSave, latest.couldSave)
    assert.ok(money.losing.couldSave > 0)
  })

  it("no one-time figure is labelled per month or annualised", async () => {
    const cost = await getSiteCost(SITE)
    for (const o of cost.opportunities) {
      if (o.valueLabel?.includes("overcharge")) assert.match(o.valueLabel, /one-time/)
      assert.doesNotMatch(o.valueLabel ?? "", /annual|a year/)
    }
    for (const f of (await getBillDetail(JAN)).check.findings) assert.ok(f.method.lines.length > 0, `${f.title} has a method`)
  })
})
