# EnerSenX MVP redesign proposal

Status: **proposed, waiting for approval.** Nothing here is built yet.
Inputs: [references.md](./references.md), [principles.md](./principles.md), [ux-review.md](./ux-review.md).
Issue numbers (#) refer to ux-review.md.

## 1. Money model (fixes #1, #2, #4, #8, #11, #12)

| | Before | After |
|---|---|---|
| Kinds of PKR | "Found", "Open potential / mo", "At stake", "est. annual savings", each computed on its own screen. | Five kinds with fixed labels: **Billed**, **Overcharged** (one-time, recoverable), **Avoidable / month**, **Could save about / month** (estimate), **Saved / month** (verified). One module, `src/lib/api/money.ts`, computes them; screens never add PKR themselves. |
| A billing-rule finding | "Billing error · PKR 334,825 / mo" | "**Possible overcharge** · *Likely*. PKR 334,825 overcharged on the January 2026 bill. It repeats each month until FESCO corrects it. *How we calculated this.*" (Betterment, Wealthfront: assumptions beside the figure) |
| Annual figures | × 12 on everything, in headlines | No × 12 on overcharges. Avoidable and estimated savings may add "about PKR X a year at this rate" in secondary text only. |
| Totals | "PKR at stake 2,376,898" (overcharges + budget overrun) | Removed. Where totals are useful, they are per kind: "Overcharged on the last 12 bills: PKR 6.0 million (recoverable)"; "Avoidable now: PKR 0 a month". |
| Cost per kWh | 60.38 KPI vs 42.91 "Rate" | "All-in cost per kWh" (definition in the label) and "Energy rate" kept apart (#3). |
| Proof | A test checks roles and isolation | New test: the same figure for the January bill is identical on Home, Bill detail, Actions and Alerts. |

## 2. Information architecture (fixes #5, #6, #16, #18)

| | Before | After |
|---|---|---|
| Sidebar (bills-only organisation) | 14 items: Dashboard, Bills, 5 × "Soon", Cost & Savings, Savings Actions, Alerts, Reports, Analytics, Settings, User Management | **6 items:** Home, Bills, Actions, Alerts, Reports, Settings. Nothing disabled. "Upload bill" is a primary button in the top bar (Fitts). |
| Cost & Savings | A separate page that repeats bill history | Becomes Home's **Costs** section: 12-month cost by component, budget vs actual, all-in cost per kWh. Bill history lives only in Bills. |
| Analytics | Mostly "needs a live meter" | Removed for bills-only organisations. Monthly units, peak share and carbon move into Home. |
| User Management | A second door into Settings | Removed. Settings → People (inline invite, resend, copy link: Searchable, Quo). |
| Phase-2 screens | Disabled "Soon" items for everyone | Hidden. The old sample organisation becomes "Phase 2 preview (live meters)" in the Scenario menu and keeps its old navigation. |
| Default demo | Lands on the live-meter sample | Lands on the 12-bill bills scenario. |
| Phone tabs | Home, Bills, Upload, Actions, Alerts | Unchanged (Venmo, Expensify confirm it). Reports and Settings move into the account menu. |

## 3. Changes per flow

**F1, Sign-up to first insight** (Navan, Expensify, Betterment)
- **Before:** the result says "PKR 7.5 lakh of avoidable charges", a mix of kinds, with "about 91.8 lakh a year".
- **After:** one sourced headline, "Your January bill may include PKR 3.3 lakh in overcharges", then each finding with kind, confidence and "How we calculated this". The avoidable penalty sits on its own line, per month. One primary action, "Go to Home", and a secondary "Add more months".
- **Checklist:** opens with completed steps (account, site, first bill), and each remaining step says what it unlocks (goal-gradient).

**F2, Capture and confirm** (Expensify, Mindtrip, Bevel)
- **Before:** the read blocks the card, and there's no manual path.
- **After:** "Enter the 5 numbers yourself" on the upload screen and on every read error.
- **Later uploads** appear in Bills as "Reading…" and the person can leave. The first bill keeps the in-card progress, because it is the peak moment.

**F3, Bill history and detail** (Cash App, Grab, Fresha, Wealthfront)
- **Before:** two bill histories; a wide table on phones; findings end the page.
- **After:** one list on Bills, which becomes rows on phones (month, amount right, check result below). Bill detail gets a document header (reference, DISCO, period), an explanation per line, and a "What you can do" block: Raise a complaint (copyable complaint text), Make it an action, Send a copy.

**F4, Savings actions** (incident.io, Quo, Too Good To Go)
- **Before:** four boxes; "/ mo" on one-time overcharges.
- **After:** one list with a status filter, each row naming its source bill.
  - **Correct-a-bill actions** show "overcharged PKR X on N bills (recoverable)" plus "repeats each month until fixed".
  - **Verified** shows before minus after, with the bills used.
  - **Cost & Savings opportunities** come from this same list, so a verified action can't reappear as a suggestion.

**F5, Alerts** (incident.io, Public, Stripe)
- **Before:** 4 KPI cards first; two buttons per row; "PKR at stake" mixes kinds.
- **After:** content first.
  - One summary line ("6 open, 3 critical").
  - Each row shows its source bill, with one primary action.
  - "At stake" is replaced by the alert's own figure and kind.
- **Budget thresholds** live in Settings as alert rules, not in the inbox.

**F6, Monthly cycle** (Lloyds, Bevel, Slack Later)
- **Before:** a reminder with only Upload.
- **After:** add "Not here yet, remind me in 3 days" (snooze). "What changed" shows "Previously PKR X" under each figure (Lloyds).

**F7, Settings** (Searchable, Quo, AirOps, hilos)
- **Before:** an ungrouped rail; invites can't be resent.
- **After:**
  - The rail is grouped Organisation (Profile, Sites, Budgets), People, Notifications, Billing.
  - Pending invites get Resend and Copy link.
  - Budgets are labelled as alert rules.

**F8, Mobile** (Venmo, Public, X Money)
- **Before:** 4 stacked KPI cards before content on Actions, Alerts and Bills.
- **After:** on phones, one headline figure and a summary line, then content. KPI cards only from `md` up.
- **Content rules across the app:** dates "30 Jan 2026"; full PKR figures in tables, lakh only in sentences and phone headlines.

## 4. Build order after approval

Each step is pushed and reported on its own, with before and after screenshots and the principles checklist.

1. **Money model and findings language:** money.ts, labels, confidence, method disclosure, and the consistency test. This fixes the critical issues first.
2. **Navigation:** 6-item sidebar, Upload in the top bar, default demo, Phase 2 preview.
3. **Home:** merge Cost & Savings and Analytics into Home; phone headline layout.
4. **Bills:** one list, phone rows, bill detail with "What you can do".
5. **Actions:** one filtered list with source bills.
6. **Alerts:** content first, one action per row, rules in Settings.
7. **Capture:** manual entry; background reading for later bills; snooze on the reminder.
8. **Settings and content pass:** grouped rail, resend and copy link, dates, the remaining minor issues.
