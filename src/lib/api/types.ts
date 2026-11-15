// Types shared by every screen and by the data layer. A real API returns these
// same shapes; only the files in src/lib/api/ change when it arrives.

export type Role = "owner" | "manager" | "viewer"

export type User = {
  id: string
  name: string
  email: string
  initials: string
  /** When sign-up started (real clock), for the time-to-first-insight measure. */
  signedUpAt?: string
}

export type BusinessType = "textile" | "food" | "cold-storage" | "hospital" | "school" | "office" | "retail" | "other"

export type Organisation = {
  id: string
  name: string
  businessType: BusinessType
  /** "sample": the original demo organisation whose screens read the sample files. "own": created in this browser. */
  data: "sample" | "own"
  createdAt: string
}

export type Membership = { userId: string; orgId: string; role: Role }

export type Disco =
  | "FESCO"
  | "LESCO"
  | "IESCO"
  | "GEPCO"
  | "MEPCO"
  | "PESCO"
  | "HESCO"
  | "SEPCO"
  | "QESCO"
  | "TESCO"
  | "K-Electric"

/** NEPRA tariff categories offered at sign-up (time-of-use variants). */
export type TariffCode = "A-2(c)" | "B-1(b)" | "B-2(b)" | "B-3"

export type ConnectionType = "commercial" | "industrial"

export type Site = {
  id: string
  orgId: string
  name: string
  city: string
  disco: Disco
  connectionType: ConnectionType
  tariff: TariffCode
  sanctionedKw: number
  areaSqft?: number
  archived: boolean
  createdAt: string
}

export type BillSource = { fileName: string; kind: "pdf" | "photo" | "sample"; sizeBytes?: number }

/** The 5 fields a person confirms after a bill is read. */
export type KeyField = "month" | "peakKwh" | "offPeakKwh" | "mdiKw" | "amountPayable"

export type BillLineKey =
  | "peakEnergy"
  | "offPeakEnergy"
  | "fixed"
  | "fpa"
  | "pfPenalty"
  | "electricityDuty"
  | "gst"
  | "furtherTax"

export type BillLine = { key: BillLineKey; label: string; basis: string; amount: number }

export type BillStatus = "reading" | "needs_review" | "confirmed" | "failed"

export type Bill = {
  id: string
  orgId: string
  siteId: string
  disco: Disco
  referenceNo: string
  /** Billing month, yyyy-mm. */
  month: string
  issueDate: string
  dueDate: string
  tariff: TariffCode
  sanctionedKw: number
  peakKwh: number
  offPeakKwh: number
  mdiKw: number
  powerFactor: number
  /** Lines as the DISCO printed them. */
  lines: BillLine[]
  amountPayable: number
  status: BillStatus
  source: BillSource
  /** Read confidence per key field, 0–1. */
  confidence: Record<KeyField, number>
  uploadedAt: string
}

/**
 * The kind of money a finding is about (principles.md, money model):
 * "overcharge": billed against the tariff's rules, one-time per bill, recoverable;
 * "avoidable": a legitimate charge the business can stop, per month;
 * "estimate": what a change could save, per month, estimated.
 */
export type FindingKind = "overcharge" | "avoidable" | "estimate"

/** How sure we are (principles.md T2). "confirmed" needs a verified tariff table (Milestone 3). */
export type Confidence = "confirmed" | "likely" | "check"

/** "How we calculated this": the rule, the inputs from the bill, and the arithmetic. */
export type Method = {
  rule: string
  lines: { label: string; value: string }[]
  note?: string
}

export type Finding = {
  id: string
  billId: string
  kind: FindingKind
  confidence: Confidence
  title: string
  detail: string
  /** PKR, tax included: one-time on this bill for an overcharge, per month otherwise. */
  impactPkr: number
  nextStep: string
  method: Method
}

export type Recalculation = {
  /** The same lines, recomputed against the tariff. */
  expected: BillLine[]
  expectedTotal: number
  billedTotal: number
  findings: Finding[]
}

export type ChecklistItem = { id: "site" | "bills" | "invite" | "budget"; title: string; detail: string; done: boolean; progress?: { value: number; max: number } }

export type Session = { userId: string; orgId: string; siteId: string | null }

/** The kind of saving an action pursues; one per finding type. */
export type ActionKind = "fixed" | "further" | "pf" | "peak"

export type ActionStatus = "suggested" | "accepted" | "done" | "verified" | "not_achieved" | "dismissed"

export type Person = { name: string; initials: string }

export type Verification = {
  /** Bill months compared, yyyy-mm. */
  before: string[]
  after: string[]
  /** What was measured, e.g. "PF penalty per bill". */
  measure: string
  beforeValue: string
  afterValue: string
  /** PKR a month, tax included; 0 when not achieved. */
  savedMonthlyPkr: number
  reason: string
}

export type SavingsAction = {
  id: string
  orgId: string
  siteId: string
  kind: ActionKind
  title: string
  detail: string
  /** Estimated PKR a month, tax included. */
  estMonthlyPkr: number
  status: ActionStatus
  owner?: Person
  dueDate?: string
  note?: string
  suggestedAt: string
  acceptedAt?: string
  /** ISO date the owner marked it done. */
  doneAt?: string
  verification?: Verification
}

export type AlertKind = "bill_anomaly" | "budget_overrun" | "missing_bill"
export type AlertSeverity = "critical" | "warning"
export type AlertStatus = "open" | "acknowledged" | "resolved"

export type Alert = {
  id: string
  siteId: string
  kind: AlertKind
  severity: AlertSeverity
  title: string
  detail: string
  /** PKR at stake, tax included (0 when not money). */
  impactPkr: number
  /** Bill month it concerns, yyyy-mm. */
  month: string
  raisedAt: string
  nextStep: string
  /** Where it was sent, e.g. "Email and WhatsApp to Sana Rehman". */
  sentTo: string
  status: AlertStatus
  cause?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolution?: string
  /** The savings action it became, if any. */
  actionId?: string
  /** The savings action that would deal with it; missing bills have none. */
  actionKind?: ActionKind
}

/** What people did with an alert; the alert itself is derived from bills. */
export type AlertState = Pick<Alert, "id" | "status" | "cause" | "acknowledgedAt" | "acknowledgedBy" | "resolvedAt" | "resolution" | "actionId">

export type PlanId = "starter" | "pro" | "enterprise"
export type BillingCycle = "monthly" | "annual"

export type NotificationChannel = "email" | "whatsapp"
export type NotificationTopic = "bill_anomaly" | "budget_overrun" | "missing_bill" | "bill_reminder" | "monthly_report"

export type OrgSettings = {
  orgId: string
  ntn?: string
  strn?: string
  plan: { id: PlanId | "trial"; cycle: BillingCycle; trialEnds: string; chosen?: PlanId }
  notifications: Record<NotificationTopic, Record<NotificationChannel, boolean>>
  whatsapp?: string
}
