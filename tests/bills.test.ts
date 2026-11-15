// Bill detail (step 4): every possible overcharge points at the bill line it is about,
// and that line really differs from our calculation.
import "./setup"

import assert from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import { getBillDetail, listBillRows, loadScenario, resetDemo } from "../src/lib/api"

const SITE = "s-rehmat-fsd"

describe("bill detail", () => {
  beforeEach(async () => {
    resetDemo()
    await loadScenario("bills-12")
  })

  it("links each overcharge to a bill line with a positive difference", async () => {
    for (const row of await listBillRows(SITE)) {
      const d = await getBillDetail(row.id)
      for (const f of d.check.findings.filter((f) => f.kind === "overcharge")) {
        assert.ok(f.line, `${f.id} has a line`)
        const billed = d.bill.lines.find((l) => l.key === f.line)?.amount ?? 0
        const expected = d.check.expected.find((l) => l.key === f.line)?.amount ?? 0
        assert.ok(billed > expected, `${f.id}: billed ${billed} > expected ${expected}`)
      }
    }
  })

  it("the list's possible overcharge equals the detail's overcharge findings", async () => {
    for (const row of await listBillRows(SITE)) {
      const d = await getBillDetail(row.id)
      const sum = d.check.findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0)
      assert.equal(row.overcharged, sum, row.month)
    }
  })
})
