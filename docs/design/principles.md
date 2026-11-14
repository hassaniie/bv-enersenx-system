# EnerSenX design principles

The rulebook every current and future screen must pass. Each rule has an ID so reviews and
pull requests can cite it ("fails M2"). A flow isn't done until the checklist at the end
passes. References are in [references.md](./references.md); known violations are in
[ux-review.md](./ux-review.md). How things look (components, colour, spacing, motion) is
governed by the ReUI rules in `AGENTS.md`; this file governs what we show, say and ask.

**Who we design for.** The **owner or CFO** of a Pakistani business: checks the product
monthly, on a phone as often as a laptop, wants to know whether a bill is right and what to
do. The **facility manager**: weekly, uploads bills, owns actions. Both are perpetual
intermediates, not analysts. English UI; Urdu later.

---

## 1. Money model (M)

EnerSenX makes financial claims. Every PKR figure on screen is exactly one of these five
kinds, and says which.

| Kind | What it is | Label on screen | Period |
|---|---|---|---|
| **Billed** | What the DISCO charged on a bill | "Billed" | One bill (a month) |
| **Overcharged** | Money charged on a past bill that the tariff doesn't allow; can be claimed back | "Overcharged" / "Recoverable" | **One-time**, per bill; sums across bills |
| **Avoidable** | A legitimate charge the business could stop (power factor penalty) | "Avoidable" | **Per month**, repeats until fixed |
| **Estimated saving** | What a change would save if made (peak shifting) | "Could save about" | **Per month**, an estimate |
| **Verified saving** | Measured on later bills, before minus after | "Saved" | **Per month**, measured |

- **M1. Every PKR figure states its kind and period.** "PKR 3.3 lakh overcharged on the
  January bill"; "PKR 2.7 lakh a month, avoidable"; never a bare "PKR 3.3 lakh" or "/ mo"
  on a one-time amount.
- **M2. Never annualise a one-time amount.** "× 12" is allowed only for avoidable or saving
  figures, labelled "a year at this rate", and never in a headline.
- **M3. Never add different kinds together.** "Found" is not a sum of overcharged and
  avoidable. Where both appear, show them as separate lines with their own labels.
- **M4. One number, one definition, one source.** Each metric is computed by one named
  function in `src/lib/api` and every screen calls it. The same metric for the same bill
  and period is identical, to the rupee, on every screen.
- **M5. Different scopes get different words.** "This bill", "last 3 bills", "last 12
  months", "since you joined" are written next to the figure. Two figures with different
  scopes never share a label.
- **M6. Cost per kWh has one meaning:** amount payable ÷ units, taxes included, labelled
  "All-in cost per kWh". The tariff's energy rate is a different figure, labelled
  "Energy rate (peak)" or "(off-peak)".
- **M7. Show the source bill for every number.** Every figure can be traced, in one tap,
  to the bill (month, reference number) and line it came from.

## 2. Findings and trust (T)

- **T1. A finding has four parts:** what we found (with PKR and kind), why (the tariff rule
  or comparison), what to do (one next step), and how sure we are.
- **T2. Confidence is explicit:**
  - **Confirmed**: the rule comes from a verified, versioned tariff table and the inputs
    were confirmed by a person.
  - **Likely**: the rule is standard but not yet verified for this DISCO or tariff version.
  - **Check**: a pattern worth a look (units up 18%).
- **T3. Never call something a "billing error" unless its rule is Confirmed.** Until the
  tariff engine (Milestone 3) verifies rules, these findings are "Possible overcharge",
  and the copy says what to check.
- **T4. Show the method next to any estimate or verification.** One tap: "How we
  calculated this" (bills used, rule, formula). See Betterment and Wealthfront in
  references.md.
- **T5. No hype for money claims.** No confetti, no "AI-powered", no exclamation marks.
  The peak moment is a precise, sourced figure.
- **T6. Sample data is always marked.** Demo or sample figures carry the Demo banner; sample
  tariff values are named as samples wherever a rule is explained.

## 3. UX laws, as rules for this product (U)

| ID | Law or heuristic | Rule for EnerSenX |
|---|---|---|
| U1 | **Nielsen H1, visibility of status** | Bill reading shows progress in place: the bill's row in Bills says "Reading…", so the person can leave and come back. Every action confirms with a toast saying what changed. |
| U2 | **H2, match the real world** | Use the words on a Pakistani bill: "units", "MDI", "sanctioned load", "FPA", "peak / off-peak", "due date". Explain each once, inline. No internal names ("org", "scenario", "finding id"). |
| U3 | **H3, user control** | Every flow has Back and Cancel; dismiss has Restore; mark-done can be undone until the next bill verifies it. |
| U4 | **H4, consistency** | One name per thing everywhere: "Bills" (never "Invoices" or "Bill history" in another menu), "Actions", "Alerts". The same status uses the same badge colour on every screen. |
| U5 | **H5, error prevention** | Numeric keypads for numbers, sensible ranges (sanctioned load 1–20,000 kW), month pickers instead of typed dates, impossible dates disabled. |
| U6 | **H6, recognition over recall** | Show the bill month and site on every money figure's screen. Assignee pickers list names, not emails to type. |
| U7 | **H7, efficiency** | Batch upload for back-filling months; keyboard shortcut ⌘K stays. |
| U8 | **H8, minimalist design** | Every screen has one job and one primary action. Remove "Soon" items, decorative KPIs and panels that only say "needs a meter". |
| U9 | **H9, error recovery** | Every error says what happened, what to do, and offers the action (Retry, Enter manually, Upload again). Reading failures offer manual entry. |
| U10 | **H10, help** | Each bill line and each finding type has a one-line explanation available in place. |
| U11 | **Hick's law** | Sidebar: at most 7 items for a bills-only organisation, nothing disabled. Phone tabs: 5. Each list row: at most 1 visible button. |
| U12 | **Jakob's law** | Use the patterns in references.md: labelled centre capture tab (Venmo, Expensify), bill detail with "What can you do" (Cash App), inbox with source column (incident.io), team page with inline invite (Searchable). |
| U13 | **Fitts's law** | The primary action is the largest target in its region and sits where the thumb is on phones (bottom bar, full-width buttons in flows). Touch targets ≥ 44 × 44 px. |
| U14 | **Miller's law / chunking** | A KPI row has at most 4 figures; on phones show 1 headline figure plus at most 2 supporting. The 5 bill fields are grouped (month; units; demand; amount). |
| U15 | **Progressive disclosure** | Lists show the conclusion; detail (lines, method, history) opens on demand in a sheet or detail page. |
| U16 | **Goal-gradient and Zeigarnik** | The setup checklist shows progress ("1 of 12 bills"), starts with the first item already done (account and first bill), and stays until complete; each remaining step says what it unlocks. |
| U17 | **Peak-end rule** | The first finding is the peak: one sourced PKR figure, the method, and one next step. The end of each flow is a clear "done" with what happens next. |
| U18 | **Doherty threshold** | Feedback under 400 ms for every tap; bill reading over 10 s runs in the background with a notice when done. |
| U19 | **Tesler's law** | EnerSenX carries tariff complexity: the person confirms 5 numbers; we work out categories, bands, FPA, taxes and rules. Never ask for a tariff code. |
| U20 | **Aesthetic-usability effect** | Polish is not proof. A good-looking chart with a wrong definition fails M4; review numbers before visuals. |
| U21 | **Trust and transparency** | Every money claim passes M1–M7 and T1–T4; anything a person can't verify from the screen is a defect. |

## 4. Content rules (C)

- **C1. Plain words**, short sentences, active voice, sentence case for headings and buttons.
  Buttons say what they do: "Upload bill", "Raise complaint", "Mark done".
- **C2. PKR formatting (one rule):**
  - **Full figures with commas** ("PKR 334,825") everywhere a figure can be compared or
    audited: tables, bill lines, KPI values on desktop, detail pages.
  - **Lakh and crore** ("PKR 3.3 lakh", "PKR 1.2 crore", one decimal) only in sentences and
    phone headline tiles. The full figure must be on the same screen.
  - Always write "PKR", before the number. Negative amounts use a minus sign ("−PKR 51,075").
- **C3. Dates:** day month year, "30 Jan 2026"; billing months "January 2026" (long) or
  "Jan 2026" (tables); relative time ("2 days ago") only in inboxes, and only under 7 days.
- **C4. Units:** "kWh", "kW", "%" with a space before kWh and kW ("112,240 kWh"), none
  before %. Power factor as "0.88".
- **C5. Tone for errors:** calm, specific, no blame, always a next step. "We couldn't read
  this photo. Try again in better light, or enter the 5 numbers yourself."
- **C6. Tone for money found:** factual and modest. "Your January bill may include PKR
  334,825 in overcharges." Not "We found you lakhs!"
- **C7. Empty states** say what will appear here, why it is empty, and offer one action.

## 5. Accessibility (A) — WCAG 2.2 AA, a hard requirement

- **A1.** Text contrast ≥ 4.5:1 (3:1 for large text and non-text UI) in light and dark.
- **A2.** Everything works by keyboard with a visible focus ring; dialogs and sheets trap focus
  and close on Escape.
- **A3.** Touch targets ≥ 24 × 24 px (2.5.8), our own target 44 × 44 px on phones.
- **A4.** Status is never colour alone: badges have words, severity dots have text.
- **A5.** Async changes are announced (`aria-live`) and forms announce errors next to fields.
- **A6.** Focus is never hidden behind sticky headers or the phone tab bar (2.4.11).
- **A7.** Charts have a text equivalent (the figure in the panel header or a table).
- **A8.** No horizontal page scroll at 320 px; tables become lists on phones.
- **A9.** axe reports no critical or serious violations on any screen, light and dark.

---

## Checklist (run after every flow)

Report each line as **pass** or **fail** with the screen and evidence.

- [ ] M1 every PKR figure states kind and period
- [ ] M2 no one-time amount annualised
- [ ] M3 no sums across kinds
- [ ] M4 same metric identical across screens (list the figures compared)
- [ ] M5 scope words beside figures
- [ ] M6 cost per kWh labelled with its definition
- [ ] M7 every figure traces to its bill in one tap
- [ ] T1–T3 findings have four parts, confidence, no unverified "billing error"
- [ ] T4 method available for estimates and verifications
- [ ] U8/U11 one primary action per screen; navigation within limits
- [ ] U13/U14 phone: headline first, targets ≥ 44 px, ≤ 3 figures before content
- [ ] U16–U18 progress, peak moment, background reading
- [ ] C1–C7 copy, PKR, dates, units, tone, empty states
- [ ] A1–A9 axe clean light and dark, keyboard, 320 px, contrast
- [ ] ReUI rules (AGENTS.md) and self-checks C1–C4 pass
