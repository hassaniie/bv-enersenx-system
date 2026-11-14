// Role checks and organisation isolation in the data layer (src/lib/api).
// Run: npm test
import "./setup"

import assert from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import {
  acceptAction,
  changeRole,
  choosePlan,
  confirmBill,
  createOrganisation,
  getBill,
  getMe,
  inviteMember,
  listActions,
  listBillRows,
  listMembers,
  loadScenario,
  removeMember,
  resetDemo,
  saveBudget,
  setDemoRole,
  setSiteArchived,
  signUp,
  switchOrganisation,
  uploadBill,
  getSites,
} from "../src/lib/api"

const SITE = "s-rehmat-fsd"

async function asRole(role: "owner" | "manager" | "viewer") {
  await loadScenario("bills-12")
  await setDemoRole(role)
}

describe("roles", () => {
  beforeEach(() => resetDemo())

  it("a Viewer can read but every write is refused", async () => {
    await asRole("viewer")
    assert.equal((await listBillRows(SITE)).length, 12)
    await assert.rejects(uploadBill(SITE, { fileName: "x.pdf", kind: "pdf" }), /Only a Manager or Owner/)
    await assert.rejects(saveBudget(SITE, 1_000_000), /Only a Manager or Owner/)
    await assert.rejects(setSiteArchived(SITE, true), /Only a Manager or Owner/)
    const [suggestion] = (await listActions(SITE)).filter((a) => a.status === "suggested")
    await assert.rejects(acceptAction(suggestion, { owner: { name: "X", initials: "X" }, dueDate: "2026-03-01" }), /Only a Manager or Owner/)
    await assert.rejects(inviteMember({ email: "a@b.pk", role: "viewer" }), /Only an Owner/)
  })

  it("a Manager can edit sites and budgets but not users or billing", async () => {
    await asRole("manager")
    await saveBudget(SITE, 7_000_000)
    await uploadBill(SITE, { fileName: "x.pdf", kind: "pdf" })
    await assert.rejects(inviteMember({ email: "a@b.pk", role: "viewer" }), /Only an Owner/)
    const [member] = await listMembers()
    await assert.rejects(changeRole(member.id, "viewer"), /Only an Owner/)
    await assert.rejects(removeMember(member.id), /Only an Owner/)
    await assert.rejects(choosePlan("starter", "monthly"), /Only an Owner/)
  })

  it("an Owner can do everything, but can't leave the organisation without an Owner", async () => {
    await asRole("owner")
    await inviteMember({ email: "new.person@rehmattextiles.pk", role: "viewer" })
    await choosePlan("pro", "annual")
    const me = (await listMembers()).find((m) => m.isYou)!
    await assert.rejects(changeRole(me.id, "manager"), /needs an Owner/)
    await assert.rejects(removeMember(me.id), /can’t remove yourself/)
  })
})

describe("organisation isolation", () => {
  beforeEach(() => resetDemo())

  it("bills, sites and members of another organisation can't be read", async () => {
    await loadScenario("bills-12")
    const rehmatBill = (await listBillRows(SITE))[0].id
    assert.ok(await getBill(rehmatBill))

    // A new user with a new organisation.
    await signUp({ method: "email", name: "Omar Khan", email: "omar@retail.pk", password: "secret123" })
    await createOrganisation({ name: "Khan Retail", businessType: "retail" })
    assert.equal(getMe()?.org.name, "Khan Retail")

    await assert.rejects(getBill(rehmatBill), /another organisation/)
    assert.deepEqual(await listBillRows(SITE), [])
    assert.deepEqual((await listActions(SITE)).length, 0)
    assert.deepEqual(await getSites(), [])
    assert.deepEqual((await listMembers()).map((m) => m.email), ["omar@retail.pk"])
  })

  it("you can only switch to organisations you belong to", async () => {
    await signUp({ method: "email", name: "Omar Khan", email: "omar@retail.pk", password: "secret123" })
    await createOrganisation({ name: "Khan Retail", businessType: "retail" })
    await assert.rejects(switchOrganisation("o-sample"), /aren’t a member/)
  })

  it("writes can't reach another organisation's site", async () => {
    await loadScenario("bills-12")
    await signUp({ method: "email", name: "Omar Khan", email: "omar@retail.pk", password: "secret123" })
    await createOrganisation({ name: "Khan Retail", businessType: "retail" })
    await assert.rejects(setSiteArchived(SITE, true), /doesn’t exist in this organisation/)
    await assert.rejects(saveBudget(SITE, 1), /doesn’t exist in this organisation/)
    await assert.rejects(uploadBill(SITE, { fileName: "x.pdf", kind: "pdf" }), /another organisation/)
    await assert.rejects(confirmBill("bill-s-rehmat-fsd-2026-01", { month: "2026-01", peakKwh: 1, offPeakKwh: 1, mdiKw: 1, amountPayable: 1 }), /another organisation/)
  })
})
