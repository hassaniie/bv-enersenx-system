# EnerSenX MVP: design references

Real-world references from Mobbin for each MVP flow, saved in the private Mobbin collection
**[EnerSenX MVP](https://mobbin.com/collections/e39fa539-36b8-4d67-8652-27b0a6ddd61f/mobile/screens)**
(51 items; only you and your teammates can open it).

**Platform rule.** EnerSenX is a desktop-first B2B web app; the phone matters mainly for bill
capture. Desktop screens (Home, Bills, bill detail, Actions, Alerts, Reports, Settings) are
referenced from **web** apps: 10+ per screen, added before that screen is built (section 9
onwards). iOS references are kept only for capture and phone navigation. Every reference names
its platform.

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

---

# Desktop web references, added per build step

## 9. Money headlines and "How we calculated this" (step 1, the money model; also Home)

All web. Saved to the collection's web tab on 2026-11-15.

| Reference | Platform | Pattern | Take / avoid, and why |
|---|---|---|---|
| [Stripe: Home](https://mobbin.com/screens/55a2f72d-176f-4e3b-842b-cb999a421c7e) | web | An info icon next to every metric title (Payments, Gross volume, Net volume); date range and interval controls. | **Take** a definition on every headline. Ours is a "How we calculated this" trigger under each figure, because our figures need arithmetic, not just a definition. |
| [Stripe: Revenue Recognition](https://mobbin.com/screens/f21ac01f-fef4-416e-bd72-b227975f19ef) | web | Info icon per metric, "Period: Last 12 months", "Updated 3 hours ago", and a "How revenue recognition works" link in a right rail. | **Take** the period stated beside the figure ("Feb 2025 – Jan 2026") and a method link. |
| [Snowflake: Cost Management](https://mobbin.com/screens/acf53a58-0fc7-49b7-93e0-f62c164ecc79) | web | Three summary cards with info icons; forecast bars are grey and labelled "Forecasted spend", apart from actual spend. | **Take** keeping estimates visibly apart from measured money. "Could save" is always labelled "estimate" and never added to measured figures. |
| [Mercury: Home](https://mobbin.com/screens/66d54fa0-da1a-4224-a027-d0b0ac2b6e2d) | web | Cash, Expenses and Revenue columns, each headline with "vs prior period"; clicking an entry opens its line items in a side panel. | **Take** tracing a headline to its lines (M7). The Recoverable method lists the bills behind it. |
| [Revolut: Analytics](https://mobbin.com/screens/ef9b430c-0892-423d-96c4-839934a4d578) | web | Each card leads with one figure, its scope ("This month") and a delta. | **Take** one figure per card with its scope right under it. |
| [Plane: dashboard data source](https://mobbin.com/screens/978a4158-d65c-45aa-a88d-6897c137cad4) | web | A "Dashboard's data source" popover lists where the numbers come from. | **Take** the popover as the form for "How we calculated this". |
| [Gumloop: Insights](https://mobbin.com/screens/337deb65-cb56-4502-a27d-b7ea42b599d7) | web | A plain row of KPI numbers, then a chart with "Compare to previous period". | **Take** few headline numbers, then the chart. **Avoid** six equal numbers: we cap Home at three headlines. |
| [Searchable: AEO insights](https://mobbin.com/screens/683c7cb0-70a2-4a57-972c-4c070b978233) | web | Metric title, info icon and a delta chip. | **Take** the compact title + info pattern for secondary figures. |
| [Square: Loyalty setup](https://mobbin.com/screens/cd302e1d-8543-4f63-bf28-3d68a0615712) | web | "Complete your setup 80%" progress in the sidebar. | **Take** later (step 3): setup progress that doesn't push the money headlines down. |
| [Plausible: dashboard](https://mobbin.com/screens/3db69c73-30b1-47ff-8698-4fa9a403b9e6) | web | A KPI strip that doubles as a chart switcher; "28 trial days left · Choose a plan" in the header. | **Take** later (step 7): the trial counter in the header. |
| [Searchable: annotations](https://mobbin.com/screens/217543bc-0607-4aed-bdd4-fc1631be53aa) | web | A side sheet keeps the chart in view while showing detail. | **Take** detail in a sheet, not a new page, for findings. |

## 10. Navigation: sidebar, top bar, demo banner (step 2)

All web. Saved to the collection's web tab on 2026-11-15.

| Reference | Platform | Pattern | Take / avoid, and why |
|---|---|---|---|
| [Base: Home](https://mobbin.com/screens/b6fbd68e-e8ca-4cff-9de7-9046f18c2cbc) | web | Four items: Home, Discover, Activity, Settings, with Settings last. | **Take** a short list with Settings last. Ours: Home, Bills, Actions, Alerts, Reports, Settings. |
| [Revolut: web Home](https://mobbin.com/screens/a0766b74-22d8-4d4d-bb9a-a1c55fde5cf6) | web | A four-item rail for a finance product. | **Take**: proof that a finance product can run on very few top-level places. |
| [Stripe: Balances](https://mobbin.com/screens/ec4bf8ef-b6b8-4fb7-b866-293ac767904e) | web | A short top group, then collapsible product groups; page actions as toolbar buttons. | **Take** a short top group. **Avoid** product groups for now: we have one product. |
| [Mercury: Home](https://mobbin.com/screens/66d54fa0-da1a-4224-a027-d0b0ac2b6e2d) | web | "+ Add" primary button in the top bar, next to search. | **Take** the always-visible primary action: "Upload bill" in our top bar. |
| [Canva: Home](https://mobbin.com/screens/025b874d-3af6-4be7-bea2-56276bb38ef5) | web | "Create" as the first rail item; bell at the bottom opens notifications. | **Take** the create action always in reach. We keep the bell in the top bar next to Upload. |
| [Square: Bill Pay](https://mobbin.com/screens/6767626e-674a-4471-a246-4cd295fabac7) | web | "Complete your setup 67%" at the top of the sidebar; "Take payment" pinned at the bottom. | **Take** later: setup progress out of the main column (step 3). |
| [Attio: Home](https://mobbin.com/screens/a09bd591-d654-42a2-be75-7cf87688e13e) | web | A "Getting started 1/6" card and "14 days left on trial" in the sidebar. | **Take** later: trial and setup progress in the sidebar footer (steps 3 and 8). |
| [Stripe: sandbox](https://mobbin.com/screens/682babe7-7dfd-4fbf-a743-b6bbe697855c) | web | A full-width strip: "You're testing in a sandbox. Changes you make here don't affect real customers or payments." | **Take**: confirms our Demo banner (one line, what it means, always on top). |
| [Searchable: Content](https://mobbin.com/screens/903d5676-bc89-47c2-9556-b1034ef0aa43) | web | Sidebar grouped by labelled sections. | **Avoid** labels for six items; we use one ungrouped list. |
| [Upwork: Transactions](https://mobbin.com/screens/81b9bc93-3988-44b1-938e-1817f5d447a8) | web | A slim rail; detail opens as a side panel over the list. | **Take** the side panel for detail (Actions, Alerts in steps 5 and 6). |
| [n8n: workspace](https://mobbin.com/screens/28338d7a-25d5-4fd0-8357-9a770b30ac00) | web | "14 days left · 0/1000 executions" with Upgrade Now in the header. | **Take** later: the trial counter in the header (step 8). |
| [Spellbook: Home](https://mobbin.com/screens/0997d813-6c21-471c-b0e9-052164e62fab) | web | A slim rail with "+" at the top; trial counter at the top right. | **Take** the same "create first" placement. |

## 11. Home: costs over time and setup progress (step 3)

All web. Saved to the collection's web tab on 2026-11-15. Section 9 covers the money headlines.

| Reference | Platform | Pattern | Take / avoid, and why |
|---|---|---|---|
| [Snowflake: Consumption](https://mobbin.com/screens/8202bdab-d6dd-47b1-bee3-be85ef43ce53) | web | Stacked bars by category with a legend; a table with share bars below. | **Take** "Cost by Charge": one stacked bar per bill (energy, fixed, FPA and penalties, taxes). |
| [Replit: Usage](https://mobbin.com/screens/564aacce-2087-4554-910f-b5581b12be5b) | web | "Total this period" above stacked bars; the tooltip lists each category's amount. | **Take** the per-category tooltip; the chart's tooltip shows each charge. |
| [Klaviyo: Account usage](https://mobbin.com/screens/68dc63bf-a980-4cb0-bd12-da0b6a83b931) | web | Chart title, then one sentence: "This graph shows… Learn how you're charged". | **Take** one plain sentence under each chart saying what it shows. |
| [Sprig: Usage](https://mobbin.com/screens/fc58ec55-647b-4551-b7ce-a072a8ef061b) | web | Chart title plus a definition sentence and Learn more. | **Take**, same as Klaviyo. |
| [Stripe: Billing Usage](https://mobbin.com/screens/837a1c85-1863-4e88-b896-2b613a5b5333) | web | Section title with a one-line explanation; date range and interval controls. | **Take** the explanation; **avoid** range controls until sites have more than 12 bills. |
| [Stripe: Billing overview](https://mobbin.com/screens/0fe51e19-0041-4562-a91c-3e57ca0afacf) | web | Chart cards with a benchmark line ("median"). | **Take** a reference line: the budget on Cost by Charge and the 20% mark on Peak-Hour Share. |
| [Mercury: Home](https://mobbin.com/screens/c6cc0102-adb2-4a1d-830c-ddc7f75fac62) | web | Headlines with "vs prior period"; expenses by account with share bars. | **Take** later: "vs previous bill" on the latest-bill facts. |
| [fal: Usage](https://mobbin.com/screens/1ab60074-9c4d-42b0-b079-9c533c01cb1b) | web | Figures with a caveat line; an empty chart that says when data will appear. | **Take** the empty state: "Trends need 3 months of bills. You have 1." |
| [Base44: Credit usage](https://mobbin.com/screens/8920555b-97e2-4762-8434-62c78d2955e5) | web | A horizontal bar list, then "Daily usage: see how many credits you used each day." | **Take** the subtitle pattern. |
| [Searchable: Getting started](https://mobbin.com/screens/b3079404-1529-49f4-b72b-e83535cbe016) | web | "2 of 6 completed" with a bar; done steps struck through; the open step shows one action. | **Take** "Set up": done steps first and struck through, "2 of 4 done", one action per open step. |
| [Wix: Dashboard setup](https://mobbin.com/screens/f802ec7b-85d5-4d7e-9807-9392016b3a9a) | web | "1/5 completed" and the current step expanded with its action. | **Take** each open step saying what it unlocks. |
| [Square: Home](https://mobbin.com/screens/9a32644d-c67c-4185-b2f3-f50af9ecf43a) | web | "3 of 6 steps completed" above the performance section, then "Performance, updated…". | **Take** setup above performance, gone once complete. |

## 12. Bills: list and bill detail (step 4)

All web. Saved to the collection's web tab on 2026-11-15.

**Bills list**

| Reference | Platform | Pattern | Take / avoid, and why |
|---|---|---|---|
| [Stripe: Invoices](https://mobbin.com/screens/90ed1ed3-2dff-43c5-90fd-4df445f5a64b) | web | Status tabs as large filter buttons; filter chips; total as the first column. | **Take** filter chips (our `filters`); **avoid** status tabs while every demo bill has the same status. |
| [Stripe: Invoices, Overdue](https://mobbin.com/screens/0d5a5270-71cb-4ca7-96dc-179160ae1758) | web | A filtered view reached from a status; the filter stays visible. | **Take** `/bills/?status=overcharged`: the list opens filtered, with the filter chip visible and clearable. |
| [Mercury: Invoices](https://mobbin.com/screens/36f606b5-2ee5-4b26-ba14-0204c5295576) | web | Compact sortable table; the row opens the detail. | **Take** sortable money columns and the month as the link. |
| [Square: Invoices](https://mobbin.com/screens/49779c48-a258-4370-8f07-02ef11f76a02) | web | "Paid (last 30 days)" summary above the table; search, filter, date, Export. | **Take** one summary above the list, with its scope; on phones it becomes one line. |
| [Square: Estimates](https://mobbin.com/screens/6480957e-23da-400f-a4af-125f61129b8d) | web | Sortable date and amount columns; status as text with one inline action. | **Take** one action per row at most. |
| [Shopify: Bill Pay](https://mobbin.com/screens/0c2785b5-59e6-489f-bc50-216cbc0d81d5) | web | Vendor, amount, due date, status, bill number; "Enter missing details" inline on rows that need it. | **Take** later (step 7): "Reading…" and "Enter the numbers" inline on a bill row. |
| [Shopify: Bill Pay tabs](https://mobbin.com/screens/5a2d171e-3dba-4cdf-b719-629c91e27ced) | web | Status badges with words (Overdue, Unpaid), Import bills as a page action. | **Take** words on every badge (A4); one page action (Upload bill lives in the top bar). |
| [Canva: Orders and invoices](https://mobbin.com/screens/fc424e75-fdaf-4eb1-ab69-b44ad50d7e0d) | web | Search and filters above a table; "No results found" with no way back. | **Avoid** the dead end: our empty filter result offers "Clear filters". |
| [Meetup: Payments received](https://mobbin.com/screens/7bf9f52e-2588-4c7b-88ab-c2d4c1ea65cc) | web | A total card above a short table. | **Take** the total with its scope ("Recoverable, possible overcharges, one-time"). |
| [Unify: Tasks](https://mobbin.com/screens/d0ed0080-e283-4480-bb5a-bf968c41f30c) | web | A filter menu with typed fields and saved views. | **Avoid** saved views for now; 2 fields (year, check result) are enough. |
| [Midday: Invoices](https://mobbin.com/screens/5313da10-8abf-4f2a-9aec-7a705b12ff3c) | web | Open / Overdue / Paid totals above the list; detail in a side sheet. | **Take** the totals; **avoid** the sheet for bills: a bill is a document with a page of its own. |

**Bill detail**

| Reference | Platform | Pattern | Take / avoid, and why |
|---|---|---|---|
| [Stripe: Invoice detail](https://mobbin.com/screens/e9266461-9e6f-475f-b48d-9320c24c835a) | web | Document header (number, status, billed to, amount); actions in a menu; details on the right. | **Take** the header: month, status, DISCO, reference, due date, then the figures; facts on the right. |
| [Mercury: Invoice](https://mobbin.com/screens/f46a2587-26e3-4922-a8d0-d25acfd64768) | web | Line items with a total row, then the attachment. | **Take** the lines table with an "Amount payable" total; the original file as a header action. |
| [Square: Client view](https://mobbin.com/screens/9ea0f032-7670-46da-ad18-1836c114f9df) | web | Each line with its arithmetic ("$6.00 ea. × 80") under the name. | **Take** "Our calculation: 273 kW × 1,250" under each line. |
| [Shopify: Bill](https://mobbin.com/screens/512520ce-bc7e-4819-9cc4-16049b6e6572) | web | Bill total and status first, then a timeline, then the breakdown. | **Take** the order: what it is and what's wrong first, the breakdown after. |
| [Descript: Invoice](https://mobbin.com/screens/44552d5c-359e-4627-8ba7-149419c5871b) | web | A label–value list for the facts; subtotal and total. | **Take** the label–value Bill Facts. |
| [Midday: Invoice sheet](https://mobbin.com/screens/5313da10-8abf-4f2a-9aec-7a705b12ff3c) | web | Copyable invoice link; activity history. | **Take** "Send a copy": a summary with the link, copied for email or WhatsApp. |
| [Revolut: Transaction](https://mobbin.com/screens/39b6da94-c735-43e9-8664-ead03f134696) | web | Detail panel ends in "Get help" for a wrong charge. | **Take** a way to act on a wrong charge on the same screen: "Raise a complaint". |
| [Stripe: Refund payment](https://mobbin.com/screens/2bdb6a19-8e3b-4225-a79d-692c289fca0d) | web | A dialog with amount, reason and a note, explaining what happens next. | **Take** the complaint dialog: what it is for, the editable text, one primary action ("Copy text"). |
| [Square: Disputes](https://mobbin.com/screens/7572c6dc-158d-4c88-befa-48bf17c14595) | web | Disputes by state: Needs response, In review, Resolved. | **Take** later (step 5): complaints tracked as actions with their state. |
| [Upwork: Transaction](https://mobbin.com/screens/81b9bc93-3988-44b1-938e-1817f5d447a8) | web | Fees shown as arithmetic ("$5.00 × 10.0% = $0.50"). | **Take**, same as Square: the arithmetic in place (U10). |
| [Stripe: Receipt history](https://mobbin.com/screens/65937182-2b16-46e9-8214-2e0c794b8b4b) | web | "View receipt / Send receipt" and a history of what was sent. | **Take** later: a record of complaints sent. |
| [WeTransfer: Share](https://mobbin.com/screens/518e4c28-a372-4385-bde2-c6854efac665) | web | "Link copied" confirmation after a copy. | **Take** a toast after every copy ("Complaint copied", "Summary copied"). |
