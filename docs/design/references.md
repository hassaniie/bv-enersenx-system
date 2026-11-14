# EnerSenX MVP: design references

Real-world references from Mobbin for each MVP flow, saved in the private Mobbin collection
**[EnerSenX MVP](https://mobbin.com/collections/e39fa539-36b8-4d67-8652-27b0a6ddd61f/mobile/screens)**
(51 items; only you and your teammates can open it).

How to use this file: Mobbin shows **patterns** (what goes where, in what order, with what words).
ReUI decides the **look**. We never copy another app's colours, type, illustration or layout chrome.
"Take" means adopt the pattern; "Avoid" means a pattern we deliberately reject, with the reason.

Last updated: 2026-11-14 (UX review and design foundations milestone).

---

## 1. Sign-up and onboarding to a first "aha" result

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Expensify: Onboarding (classic)](https://mobbin.com/flows/727a8462-a160-4dfb-bddd-4ac673a5b65d) (web flow) | Intent picker on first visit, then a home feed of "Concierge" task cards; a "Free week" reward for finishing a setup task; "Days remaining" trial badge in the header. | **Take** the task card with a concrete reward for finishing (goal-gradient) and the always-visible trial counter. **Avoid** the intent picker: EnerSenX has one job on day one (check a bill), so a choice screen is pure excise. |
| [Navan: Enabling Navan Expense](https://mobbin.com/flows/4454d14c-c80b-435a-9ed2-7c93b627f52d) (web flow) | Value list, explicit pricing consent next to the primary button, a "Success!" card that hands over to a list of setup tasks. | **Take** stating the price consequence beside the button (trust) and ending setup on a task list, not a blank dashboard. |
| [Airwallex: Completing a setup (spend)](https://mobbin.com/flows/8d2de823-f53a-4955-9ae4-f8b68a747127) (web flow) | Feature toggles in a modal, then a dashboard of empty charts showing "0.00 USD". | **Avoid** landing a new user on zero-value charts: it reads as "nothing works". Our new-user dashboard must show the one bill and its finding, and hide trend charts until they have data. |
| [Betterment: connected accounts result](https://mobbin.com/screens/c0f16346-d8fa-48c6-8efe-becb304489d7) (iOS) | After linking, it explains in plain words how the numbers will be used, with a link to the projection disclosure. | **Take** "how we got this number" next to the first result. Our first finding is a money claim; it needs its method one tap away. |
| [Careem: bank added](https://mobbin.com/screens/3ddca03e-6ea1-41fe-b9ca-ea9582cbf669) / [Cleo: "Are you ready?"](https://mobbin.com/screens/b7a3670a-577e-475d-8146-b33ea611f314) (iOS) | Success screens: Careem gives one sentence and one primary action; Cleo gives confetti and no number. | **Take** Careem's one primary action. **Avoid** Cleo's celebration without substance; for a CFO, the peak moment is a specific PKR figure with its source, not confetti. |

## 2. Document capture: photograph or upload a bill, then confirm fields

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Expensify: Creating an expense](https://mobbin.com/flows/96eca170-e2c5-41da-be39-bc51510e7837) and [using a photo](https://mobbin.com/flows/49a113d4-5959-4b6e-ae99-a4a0a0e917c3) (iOS flows) | Centre "+" tab; Manual / Scan / Distance switcher; full-screen camera with a big shutter and gallery icon; "Confirm details"; the expense then appears in the feed marked "Review required" while scanning finishes. | **Take** the non-blocking read: the bill appears in the list as "Reading…" and the person can leave. **Take** a manual-entry path beside Scan. **Avoid** forcing confirmation before the person can do anything else. |
| [Mindtrip: Adding a receipt](https://mobbin.com/flows/bb70bcb1-20c6-4c60-a409-10a6cb8e3534) (iOS flow) | After upload, a skeleton row says "Analyzing uploaded file — it will take a moment", then becomes the real item. | **Take** progress shown in place (the row in Bills), with honest timing copy. |
| [Venmo: check capture](https://mobbin.com/screens/7c6f985e-fb6e-427e-9dda-92a2c9ce3ba3), [Airbnb: card capture](https://mobbin.com/screens/db45321e-5bb6-48bd-b2ee-eda57904f3dd), [Neo Financial / Onfido](https://mobbin.com/screens/26c5643f-3384-402d-83b3-828071486501) (iOS) | A document frame overlay, a live hint ("Hold still", "Use front of check"), a Tips link, and a green tick when the capture is good. | **Take** short guidance and a quality check. Constraint: a web `<input capture>` opens the phone's own camera, so we can't overlay a frame; guidance goes before (tips) and after (preview with Retake). A native app could add the frame later. |
| [Bevel: barcode with manual entry](https://mobbin.com/screens/b1f1b8d0-0c27-4157-a4a1-3f05e69d825a) (iOS) | "Focus to auto-scan, or enter it manually" with a keypad on the scanner. | **Take** a visible escape to manual entry when reading fails (error recovery). |

## 3. Bill or statement history and line-item detail

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Cash App: bill details](https://mobbin.com/screens/e4af1d8b-95b4-4227-8289-b90f68bb7930) (iOS) | Every tax and fee on its own line, bold total, then "What can you do": view transactions, contact support. | **Take** next steps directly under the lines. Our bill detail should end with "Raise a complaint with FESCO" and "Make it an action", not leave the user at the total. |
| [Grab: payment details](https://mobbin.com/screens/9daa44ec-0c6b-4557-9949-b68323f34f96) (iOS) | An info icon on a fee explains it; discounts are green and negative. | **Take** an explanation per line (what FPA, further tax, fixed charge mean). |
| [Fresha: invoice](https://mobbin.com/screens/67f765ef-c59f-478c-98d0-a46a3b103a1f) (iOS) | Header with number, date, from and billed-to, then lines, subtotal, tax, total, and Send a copy / Download. | **Take** the document header (reference number, DISCO, period) and "Send a copy" for the owner. |
| [Wealthfront: transactions](https://mobbin.com/screens/7d890851-0489-4e75-8576-6970d538af41) / [Neo Financial: statements](https://mobbin.com/screens/29263ae3-9a04-4d4e-b6d7-0b8906f74166) (iOS) | On a phone, history is a list: title, date below, amount on the right; statements grouped by year. | **Take** a list on phones instead of a sideways-scrolling table. |
| [Venmo: statements](https://mobbin.com/screens/847c606b-699e-49f2-974e-3ae56c45aa48) (iOS) | Month picker, month summary (fees this month, fees this year), Download CSV, Send to email. | **Take** month and year-to-date side by side, each labelled. |

## 4. Recommendations that become tracked tasks with an owner and verification

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Wealthfront: plan with assumptions](https://mobbin.com/screens/287af5fa-3066-4305-bc1d-2bad0e22db46) (iOS) | Every figure labelled "/mo"; info icon on totals; "My assumptions" under the number; Methodology link. | **Take** the unit on every money figure and the assumptions next to an estimate. This is the direct fix for our "/ mo" confusion. |
| [Too Good To Go: money saved](https://mobbin.com/screens/97291e02-f6f4-4698-8402-e24263cd44c6) (iOS) | Saving shown as arithmetic: original value minus what you paid equals money saved, per month, with a running total. | **Take** verified savings shown as before minus after, with the bills used. |
| [incident.io: My tasks](https://mobbin.com/screens/36336a62-3753-49f0-a0ab-b89de9ca9d7e) (web) | One flat task list; the source incident under each title; a side panel with "View follow-up" back to the source. | **Take** the source link on every action (which bill and finding it came from) and a side panel for detail. |
| [Plane: work item](https://mobbin.com/screens/1a880805-830b-428f-b3d9-4fff87427af4) / [Quo: tasks](https://mobbin.com/screens/f4c7177b-f9e6-4858-8f53-7e6acc0be393) (web) | Status, owner and due date as a property row; Activity / History tab; one table filtered by status. | **Take** one list with a status filter rather than four boxes; keep an activity history. |
| [Copilot: budgets](https://mobbin.com/screens/da918ea9-125e-4db9-b9da-b037affb92d0) / [Cleo: save hacks](https://mobbin.com/screens/ba404bd5-cad3-42d1-85e1-91f2a8d30dd2) (iOS) | Copilot separates "this year" and "this month" metrics with labels; Cleo uses playful toggles. | **Take** Copilot's labelled periods. **Avoid** Cleo's gamified tone for a B2B finance audience. |

## 5. Alerts and notification inbox with acknowledge and resolve

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [incident.io: Alerts](https://mobbin.com/screens/17cf085a-f013-4461-832f-b1c914b0d153) (web) | One table: alert, created (relative), status dot, **source**, priority; a time filter; "Escalate to someone" in the header. | **Take** the source column (which bill raised it) and priority as a badge. |
| [Stripe: usage alerts](https://mobbin.com/screens/1d54a8a8-7019-48a2-bb04-31e3e673b6d5) (web) | Alert **rules** (name, active, threshold, last fired) live apart from alert events. | **Take** the split: budgets and thresholds are rules in Settings; the inbox only holds events. |
| [Public: inbox](https://mobbin.com/screens/a6751b2f-6f73-4d79-90d8-bd6d9ffc30f4) (iOS) | Content first, no summary cards; a category chip, date on the right, one sentence with the amount; grouped by time; one Filter button. | **Take** content first on phones. Our 4 stacked KPI cards push every alert below the fold. |
| [Lloyds: inbox](https://mobbin.com/screens/77314281-ca49-47a3-924f-dd8dca24596b) (iOS) | Inbox / Archive tabs, All / Read / Unread, bulk select. | **Take** Open / Done as two views rather than four filters. |
| [Venmo: notifications](https://mobbin.com/screens/36c13d63-7e47-4dd2-bcfa-1c294e8a953f) (iOS) | Two full-width buttons on every item. | **Avoid**: a list of button pairs is noise. One primary action per row; the rest in the detail. |

## 6. Recurring cycle and reminders

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Lloyds: upcoming payments](https://mobbin.com/screens/cd152d76-844d-411c-b3f7-a4b92a6c5cd2) (iOS) | A timeline to a date; each item shows the amount with "Previously" (last amount) under it; a separate section says what it hasn't learned yet. | **Take** "previously" beside every new figure, and honest copy for what we don't know. |
| [Bevel: check-ins](https://mobbin.com/screens/7d1c4727-8ec4-4057-9f30-6db9cc346d65) (iOS) | Each reminder: title, "Upcoming in 1 hour", schedule, on/off toggle. | **Take** the reminder as a visible, switchable object (in Settings → Notifications). |
| [Neo Financial: bill payment](https://mobbin.com/screens/de5a6c50-c6ef-46a7-ac96-c9d8320e0a73) (iOS) | Labelled rows (repeats, date, processing time) before Confirm. | **Take** labelled rows for "expected around", "reminded on". |
| [Slack: Later](https://mobbin.com/screens/50e0695f-9503-45f9-b9b9-4ebb1e8067d2) (iOS) | In progress / Completed tabs; per item Complete and "remind me later". | **Take** a snooze on the bill reminder ("Not here yet, remind me in 3 days"). |

## 7. Settings: organisation, team and roles, invites, plans and billing

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Searchable: Team](https://mobbin.com/screens/462d08d4-2fac-4787-8c60-8526e217f2c0) (web) | Settings rail grouped Account / Workspace / Integrations; invite field inline on the team page; All / Pending tabs; a "Roles" explainer. | **Take** the grouped rail and inline invite. |
| [Quo: Members](https://mobbin.com/screens/bd00722d-171b-4c94-8565-7f32f52637ff) / [AirOps: Team](https://mobbin.com/screens/1722c6f1-6c78-48d7-b459-3dfef04cdf12) (web) | Pending rows get "Copy invite link" or "Resend invite"; role select inline per member. | **Take** Resend and Copy link for pending invites (WhatsApp sharing is common in Pakistan). |
| [Base44: Billing history](https://mobbin.com/screens/909420e7-06b1-4526-9d6c-bda5f3c4dd01) / [fal: Invoices](https://mobbin.com/screens/d13091a5-c08e-4f4a-a9fa-d6783b9ccbb2) (web) | Settings rail groups; invoices table with status badge and a download per row. | **Take** grouping (Organisation / People / Billing) once the rail grows. |
| [hilos: plans](https://mobbin.com/screens/c8f42e8c-c483-4743-8dba-470c1550a3b0) (web) | Each plan says "For this workspace: $20/month for 1 billable seat after the trial", and what happens when the trial ends. | **Take** the price computed for the customer's own site count. We already do this; keep it. |
| [Sprig: Billing & Plans](https://mobbin.com/screens/5f038dda-da62-48c7-b073-069f92efb6f7) / [Replit: compare plans](https://mobbin.com/screens/52c111db-f725-46c6-acaf-b43660e2e0aa) (web) | "Your plan" badge and a disabled "Current plan"; "Everything in X, plus"; Enterprise as a separate row with Contact sales. | **Take** Enterprise as a separate row and "Everything in Starter, plus". |

## 8. Mobile navigation with a primary capture action

| Reference | Pattern | Take / avoid, and why |
|---|---|---|
| [Venmo: home](https://mobbin.com/screens/e9ecff11-4a0c-47db-ade7-aa60346f9453) (iOS) | Five tabs with a raised, **labelled** centre action ("Pay/Request"). | **Take**: confirms our labelled centre Upload. |
| [Expensify: inbox tabs](https://mobbin.com/screens/d3b7dbf8-3888-4222-9b79-bc7cc8d7b902) (iOS) | Inbox, Reports, centre "+", Workspaces, Account. | **Take** an inbox-first tab set; settings live under the account, not in a tab. |
| [Cal AI: scanner modes](https://mobbin.com/screens/eadf867f-ca9d-426b-97bd-7aaaaf48528f) / [Shopify: inventory scanner](https://mobbin.com/screens/7a1afa26-153f-41da-9459-fdd306f93a21) (iOS) | Capture mode switcher, help "?", "Last scanned item" and "Review scans" for batches. | **Take** batch capture for multi-month back-fill ("add 11 more bills"), reviewed together afterwards. |
| [X: Money](https://mobbin.com/screens/924e3b0f-d877-45a2-8725-871c0c02addb) (iOS) | One big number first, four quick actions, then two labelled summary tiles. | **Take** one headline figure on the phone dashboard instead of four equal cards. |
