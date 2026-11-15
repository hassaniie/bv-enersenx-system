# EnerSenX MVP: UX review

A structured review of every MVP flow and screen against [principles.md](./principles.md)
(rule IDs) and [references.md](./references.md). Evidence was measured on the built app on
2026-11-14 with the demo scenario **"New site, 12 bills"** (Rehmat Textiles, January 2026
bill) at 1440 px and on an emulated iPhone 13 (390 × 664 px viewport).

Severity:
- **Critical**: a wrong or misleading money claim, or a task that can't be completed.
- **Major**: causes real confusion or extra work.
- **Minor**: polish.

Status: issues fixed so far are listed under "Fixed" at the end, with the step that fixed them.

## Measured evidence: one bill, many numbers

| Screen | Figure shown | What it actually is |
|---|---|---|
| Dashboard KPI | "Found on this bill PKR 502,864" | Possible overcharges on the January bill (fixed charges 334,825 + further tax 168,039), tax included. One-time. |
| Savings Actions KPI | "Open potential PKR 502,864 **/ mo**" | The same two overcharges, labelled as a monthly figure. |
| Savings Actions rows | "PKR 334,825 / mo", "PKR 168,039 / mo" | The January overcharge, again "/ mo". |
| Alerts KPI | "PKR at stake 2,376,898" | Overcharges on 3 bills **plus** budget overruns on 2 bills: two kinds of money added together. |
| Cost & Savings KPI and Bills KPI | "Found on your bills / Found across bills PKR 8,703,353" | Overcharges plus power factor penalties on 12 bills. Consistent between the two screens, but it mixes one-time and avoidable. |
| Cost & Savings opportunities | "Low power factor penalty: PKR 3,687,036 est. annual savings" | Average past penalty × 12. The penalty was already fixed in December and verified on Savings Actions. |
| Cost & Savings opportunities | "Fixed charges…: PKR 3,292,200 est. annual savings" | One-time overcharge × 12, called a "saving". |
| Onboarding result (first bill) | "Left as is, about PKR 91.8 lakh a year" | That bill's overcharges and penalty × 12. |
| Cost & Savings KPI | "Cost per kWh 60.38, All-in, taxes included" | Amount payable ÷ units. |
| Cost & Savings bill history | "Rate (PKR) 42.91" | Energy charges only ÷ units, unlabelled. |
| Phone, Alerts | First alert at 719 px; viewport 664 px | 4 stacked KPI cards push all alerts below the fold. Actions: 649 px. Bills: 744 px. |

## Issues

| # | Screen / flow | Problem | Breaks | Severity | Proposed fix |
|---|---|---|---|---|---|
| 1 | Savings Actions, Cost & Savings, Onboarding result | One-time overcharges shown as "/ mo" and annualised × 12 ("est. annual savings", "about 91.8 lakh a year"). | M1, M2, T5 | **Critical** | Show each kind with its period (see money model). An overcharge reads "PKR 334,825 overcharged on the January bill; repeats each month until FESCO corrects it". No × 12 on one-time money; avoidable and estimated savings may show "a year at this rate" in secondary text. |
| 2 | Dashboard, Alerts, Savings Actions | The same January bill shows 502,864 "found", 502,864 "/ mo open", 2,376,898 "at stake", with different scopes and kinds and no labels to tell them apart. | M3, M4, M5 | **Critical** | One money module in `src/lib/api` (`moneyForBill`, `moneyForSite`) used everywhere. Remove "PKR at stake". Every figure carries its scope ("January bill", "last 12 bills"). A test asserts the same figure on Dashboard, Bill detail, Actions and Alerts. |
| 3 | Cost & Savings | Cost per kWh is 60.38 in the KPI and 42.91 as "Rate" in bill history, with no definitions. | M6, U4 | **Major** | KPI: "All-in cost per kWh, PKR 60.38 (amount payable ÷ units, taxes included)". Table column renamed "Energy rate" with a header tooltip, or removed from bill history. |
| 4 | All "billing error" findings, alerts, badges, "12 of 12 bills overcharged" | Called billing errors although the tariff rules are sample values, not verified NEPRA rules. | T2, T3, T6 | **Critical** | Rename to "Possible overcharge" with confidence "Likely" and a line saying which rule and what to check on the bill. "Billing error" (Confirmed) is reserved for Milestone 3's verified tariff tables. |
| 5 | Sidebar | 14 items: 5 disabled "Soon", "User Management" duplicates Settings, Analytics is mostly "needs a live meter", Reports has an Equipment template that can't run. | U8, U11, H4 | **Major** | Bills-only navigation of 6: Home, Bills, Actions, Alerts, Reports, Settings. Cost & Savings and Analytics merge into Home and Bills. Phase-2 items are hidden, not disabled. User Management becomes Settings → People. |
| 6 | Bills vs Cost & Savings | Bill history exists twice (Bills page and the Cost & Savings "Bill History" table) with different columns. | U4, M4 | **Major** | One bill list, on Bills. Cost & Savings becomes the cost section of Home (trend, breakdown, budget) and links to Bills. |
| 7 | Phone: Savings Actions, Alerts, Bills | 4 stacked KPI cards before any content; the first item is below the fold. | U14, U8; Public inbox reference | **Major** | On phones: content first, one summary line ("6 open, 3 critical") above the list; KPI cards only from `md` up. |
| 8 | Cost & Savings opportunities | Suggests the power factor fix (PKR 3.7 million "annual") after the action was done and verified. | M4, H1 | **Major** | Opportunities come from the same action list as Savings Actions; done or verified kinds drop out. |
| 9 | Alerts | Two buttons on every row (Make it an action, Acknowledge). | U11; Venmo "avoid" | **Minor** | One primary per row (Acknowledge, or Upload for a missing bill); the rest in the detail sheet. |
| 10 | Alerts | "Units down 18% in November" compares with the 3 months before, so normal seasonal drops raise alarms. | T2, H2 | **Minor** | Compare with the same month last year when available, else with the 3-month average and confidence "Check". Don't alert on drops under 25%. |
| 11 | Onboarding result, findings everywhere | No "How we calculated this"; the rule and the inputs aren't one tap away. | T1, T4; Betterment | **Major** | Each finding gets a method disclosure: the rule, the inputs from the bill, the arithmetic. |
| 12 | Findings | No confidence level on findings; "Peak share above the 20% we suggest" has no justification. | T1, T2 | **Major** | Confidence badge (Confirmed, Likely, Check) on every finding; explain the 20% (typical TOU shift potential) or drop it. |
| 13 | Bill reading | The 4-stage read blocks the card for about 4 seconds, and the person can't leave and come back. | U1, U18; Expensify, Mindtrip | **Minor** | Show the bill in Bills as "Reading…" and let the person leave; notify when ready. (Keep the in-card progress for the first bill: it is the peak moment.) |
| 14 | Bill capture | No manual-entry path if a photo can't be read; Retake is the only recovery. | U9; Bevel | **Major** | "Enter the 5 numbers yourself" on the read-error screen and on the upload screen. |
| 15 | Dates everywhere | US order ("Jan 30, 2026"). | C3 | **Minor** | "30 Jan 2026" via one formatter. |
| 16 | Demo landing | A first visit lands on the sample organisation's live-meter dashboard (Phase 2), which contradicts the bills-first MVP. | H2, U8 | **Major** | Default demo becomes the 12-bill bills scenario; the sample organisation is renamed "Phase 2 preview (live meters)" in the Scenario menu. |
| 17 | Savings Actions | Four boxes (Suggested, In progress, Waiting, Results) plus Dismissed; on phones they stack into a long scroll. | U8, U12; Quo, incident.io | **Minor** | One list with a status filter (Suggested, In progress, Waiting for bills, Done), each row showing its source bill. |
| 18 | Analytics (bills-only) | 1 of 3 panels is "Needs a live meter"; the KPIs repeat Dashboard figures. | U8, M4 | **Major** | Remove Analytics from the bills-only navigation; move monthly units, peak share and carbon into Home's cost section. |
| 19 | Dashboard | "Latest bill … due Jan 30" while today is 1 Feb, with no paid or unpaid state. | H1 | **Minor** | Show "Due 30 Jan 2026" and, since we don't know payment status, never imply overdue. |
| 20 | Settings → Users | Pending invites can't be resent or shared as a link. | Quo, AirOps | **Minor** | "Resend" and "Copy invite link" (WhatsApp-friendly) on pending rows. |
| 21 | Onboarding checklist | Starts at "1 of 12 bills"; setup steps already done (account, site, first bill) aren't shown as progress. | U16 | **Minor** | Show completed steps first ("Account, site and first bill: done"), then the remaining ones, each saying what it unlocks. |
| 22 | Carbon KPI | "642.9 tCO₂" without the period in the value line; the grid factor is a sample. | M5, T6 | **Minor** | "642.9 tCO₂, Feb 2025 – Jan 2026", with "sample grid factor" in the method. |

## What works and must be kept

- **The path to the first finding.** About 10 seconds of automated clicks in our tests, and
  about 19 seconds by your own measure, from sign-up to a sourced PKR finding: far under the
  10-minute target.
  Don't add steps before the first bill.
- **The 5-number confirm step** with "Read clearly / Please check" badges: Tesler's law done
  right, and it matches Expensify's Confirm details.
- **Labelled centre Upload tab on phones**, matching Venmo and Expensify.
- **Verification shown as arithmetic** (before, after, bills used) in the action sheet,
  matching Too Good To Go and Wealthfront.
- **Bill detail with each line billed vs recalculated**, matching Cash App and Grab.
- **Plan prices computed for the customer's own site count**, matching hilos.
- **Roles enforced in the data layer and explained in the UI** ("View only…").
- **Accessibility baseline:** axe clean (no critical or serious) on every flow, light and dark,
  at 1440 and 390.

## Fixed

| # | Fixed in | What changed |
|---|---|---|
| 1 | Step 1, money model | Overcharges say "one-time, on this bill"; no × 12 anywhere; opportunities and actions show each figure's own kind and period. |
| 2 | Step 1 | One module (`src/lib/api/money.ts`); "PKR at stake" replaced by "Possible overcharges, one-time"; `tests/money.test.ts` checks the January figure is identical on Home, Bill detail, Bills, Alerts and Actions. |
| 3 | Step 1 | "All-in cost per kWh (amount payable ÷ units, taxes included)"; the bill-history column is "Energy rate". |
| 4 | Step 1 | "Possible overcharge" with confidence (Likely or Check); no "billing error" claims in the UI. |
| 8 | Step 1 | Opportunities drop kinds whose saving is verified; a failed action still counts. |
| 11 | Step 1 | "How we calculated this" on every finding and every headline. |
| 12 | Step 1 | Confidence badge on every finding. |
