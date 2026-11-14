# Decisions

## 2026-11-14 — Milestone 1 (Foundations) stack: proposed, paused

Milestone 1 is paused: no accounts created, no backend built. This records the
stack proposal so it can be picked up later. Costs are list prices at 1–20 sites
checked in November 2026; confirm in each vendor's console before signing up.

| Need | Option A (proposed) | Option B | Monthly cost | Data location | Lock-in |
|---|---|---|---|---|---|
| Next.js host with a server | Vercel Pro, Singapore functions (`sin1`), preview deploy per branch | Render web service + preview environments, Singapore | A: $20 + usage (~$0–10). B: ~$25–45 | Singapore | Low: plain Next.js |
| Postgres + time-series | **Pending: owner's database change.** Proposed: Tiger Cloud (managed TimescaleDB), smallest size, Singapore, plus a preview service | Supabase Pro, Singapore, native partitioning (TimescaleDB is deprecated on Supabase Postgres 17) | A: ~$30–60 per service. B: $25 + ~$10 branch | Singapore | Low for tables; medium for TimescaleDB-specific features |
| Auth (email, Google, organisations) | Better Auth (open source, in our database, organisation plugin) | Clerk with Organizations | A: $0. B: $0 to 50k users / 100 orgs | A: our database. B: Clerk (US) | A: none. B: high |
| Bill file storage | Cloudflare R2, Asia-Pacific location hint, private, signed URLs | AWS S3 `ap-southeast-1` | A: $0 under 10 GB. B: ~$1–3 | APAC / Singapore | Low: S3 API on both |

Estimated total with Option A: about $80–150/month, mostly the database.

**Where customer data lives:** Singapore (AWS `ap-southeast-1`). No hyperscaler
has a Pakistan region; Mumbai was avoided because some Pakistani enterprise and
public-sector buyers object to India-hosted data. The stack is plain Postgres +
S3-compatible storage, so a Pakistan data centre stays possible later.

**Still needed when Milestone 1 resumes:** vendor accounts (Vercel, database,
Cloudflare, Google Cloud OAuth client), keys through the environment's secret
form, network allow-list for those hosts, and an email sender (Resend proposed)
for invites.

## 2026-11-14 — MVP Experience: a clickable product without a backend

- Every screen reads and writes through `src/lib/api/*` (typed async
  functions). Today they are backed by sample data plus `localStorage`
  (`src/lib/api/store.ts`); a real API replaces those files without touching
  screens.
- The app stays a static export on GitHub Pages. A "Demo mode" banner sits on
  every page with a "Reset demo" action that clears the stored state.

### Decisions made while building the MVP Experience (not covered by the scope doc)

**Data and rules (all in `src/lib/api`)**
- One switch between data sources: `OrgSwitch`. The original sample organisation keeps its sample files; organisations created in the browser read their own bills.
- Tariff rates, FPA, duty, GST, further tax and the 0.42 tCO₂/MWh grid factor are sample values in `tariff.ts` / `insights.ts`, not NEPRA notifications.
- The 5 confirmed fields: billing month, peak kWh, off-peak kWh, MDI, amount payable.
- Trends need 3 bills (`TREND_MIN_BILLS`). Budget vs actual replaces the year-over-year comparison until 24 bills exist.
- Suggestions, verification results and alerts are derived from bills on every read; only people's decisions are stored.
- Verification compares up to 3 bills before the month an action was done with up to 3 after. A charge counts as fixed when it falls 80%; a peak shift needs 3 points.
- Alerts come from the last 3 bills. Escalation (48 h) is displayed, not sent.
- Roles are checked in the data layer (`settings.ts` `can` / `assertCan`). Every read and write by site or bill id is scoped to the current organisation. `npm test` covers both.

**Screens and demo**
- Static export: bill detail and settings use query parameters (`/bills/view/?id=`, `/settings/?section=`).
- Demo banner: Scenario (sample, 1, 3, 12 bills, monthly cycle), View as (role), Try as a new user, Reset demo.
- Phones: a bottom tab bar with Upload in the middle; photos are previewed before reading; dashboard KPIs use 2 columns with short values (PKR lakh).
