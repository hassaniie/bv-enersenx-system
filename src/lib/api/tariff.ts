// A small, illustrative tariff engine: sample NEPRA-style time-of-use rates for
// the categories offered at sign-up, and the recalculation that compares a bill
// as printed with the bill the tariff says it should be. The rates are sample
// values for the demo, not a NEPRA notification; the real engine (Milestone 3)
// reads versioned tariff tables.

import type { Bill, BillLine, BillLineKey, Finding, Recalculation, TariffCode } from "./types"

export type TariffRates = {
  label: string
  /** PKR per kWh. */
  peak: number
  offPeak: number
  /** PKR per kW of billing demand per month (0 = none). */
  fixedPerKw: number
}

/** Sample rates, FY 2025–26 shape. */
export const tariffs: Record<TariffCode, TariffRates> = {
  "A-2(c)": { label: "Commercial, time of use", peak: 54.1, offPeak: 47.2, fixedPerKw: 500 },
  "B-1(b)": { label: "Industrial up to 25 kW, time of use", peak: 45.4, offPeak: 39.1, fixedPerKw: 0 },
  "B-2(b)": { label: "Industrial 25–500 kW, time of use", peak: 47.85, offPeak: 41.52, fixedPerKw: 1_250 },
  "B-3": { label: "Industrial 11/33 kV, time of use", peak: 46.9, offPeak: 40.6, fixedPerKw: 1_250 },
}

/** Fuel price adjustment for the month, PKR per kWh (sample). */
export const FPA_PER_KWH = 0.78
export const ELECTRICITY_DUTY = 0.015
export const GST = 0.18
export const FURTHER_TAX = 0.03
/** Below this power factor a penalty applies. */
export const PF_TARGET = 0.9

export const peakHours = "5 PM – 9 PM (winter), 6 PM – 10 PM (summer)"

const round = (n: number) => Math.round(n)

/** Billing demand: MDI or half the sanctioned load, whichever is higher. */
export function billingDemandKw(mdiKw: number, sanctionedKw: number) {
  return Math.max(mdiKw, Math.ceil(sanctionedKw / 2))
}

type LineInput = {
  tariff: TariffCode
  peakKwh: number
  offPeakKwh: number
  mdiKw: number
  sanctionedKw: number
  powerFactor: number
  /** Demand the fixed charge is billed on (normally billingDemandKw). */
  fixedOnKw?: number
  /** Further tax applies to unregistered consumers only. */
  furtherTax: boolean
}

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Every line of an industrial or commercial bill, in printed order. */
export function computeLines(input: LineInput): BillLine[] {
  const rates = tariffs[input.tariff]
  const demand = input.fixedOnKw ?? billingDemandKw(input.mdiKw, input.sanctionedKw)
  const peak = round(input.peakKwh * rates.peak)
  const offPeak = round(input.offPeakKwh * rates.offPeak)
  const fixed = round(demand * rates.fixedPerKw)
  const units = input.peakKwh + input.offPeakKwh
  const fpa = round(units * FPA_PER_KWH)
  const shortfall = Math.max(0, Math.round((PF_TARGET - input.powerFactor) * 100))
  const pfPenalty = round((peak + offPeak + fixed) * shortfall * 0.02)
  const duty = round((peak + offPeak) * ELECTRICITY_DUTY)
  const taxable = peak + offPeak + fixed + fpa + pfPenalty + duty
  const gst = round(taxable * GST)
  const further = input.furtherTax ? round(taxable * FURTHER_TAX) : 0

  const lines: BillLine[] = [
    { key: "peakEnergy", label: "Peak energy", basis: `${fmt(input.peakKwh)} kWh × ${rates.peak.toFixed(2)}`, amount: peak },
    { key: "offPeakEnergy", label: "Off-peak energy", basis: `${fmt(input.offPeakKwh)} kWh × ${rates.offPeak.toFixed(2)}`, amount: offPeak },
    {
      key: "fixed",
      label: "Fixed charges",
      basis: rates.fixedPerKw ? `${fmt(demand)} kW × ${fmt(rates.fixedPerKw)}` : "Not charged on this tariff",
      amount: fixed,
    },
    { key: "fpa", label: "Fuel price adjustment", basis: `${fmt(units)} kWh × ${FPA_PER_KWH.toFixed(2)}`, amount: fpa },
    {
      key: "pfPenalty",
      label: "Low power factor penalty",
      basis: shortfall ? `PF ${input.powerFactor.toFixed(2)}: ${shortfall}% below 0.90 × 2%` : `PF ${input.powerFactor.toFixed(2)}, none due`,
      amount: pfPenalty,
    },
    { key: "electricityDuty", label: "Electricity duty", basis: "1.5% of energy charges", amount: duty },
    { key: "gst", label: "Sales tax (GST)", basis: "18%", amount: gst },
    { key: "furtherTax", label: "Further tax", basis: input.furtherTax ? "3%, unregistered consumers" : "Not applicable", amount: further },
  ]
  return lines
}

export const sumLines = (lines: BillLine[]) => lines.reduce((s, l) => s + l.amount, 0)

const line = (lines: BillLine[], key: BillLineKey) => lines.find((l) => l.key === key)?.amount ?? 0

/**
 * Recomputes a bill against the tariff and explains every difference, plus
 * avoidable charges and the peak-hour opportunity. Impacts include the tax the
 * charge attracts, so the PKR figure is what the customer actually pays.
 */
export function recalculate(bill: Bill): Recalculation {
  const expected = computeLines({
    tariff: bill.tariff,
    peakKwh: bill.peakKwh,
    offPeakKwh: bill.offPeakKwh,
    mdiKw: bill.mdiKw,
    sanctionedKw: bill.sanctionedKw,
    powerFactor: bill.powerFactor,
    furtherTax: false,
  })
  const findings: Finding[] = []
  const withTax = (n: number) => round(n * (1 + GST))

  const fixedDiff = line(bill.lines, "fixed") - line(expected, "fixed")
  if (fixedDiff > 0) {
    const demand = billingDemandKw(bill.mdiKw, bill.sanctionedKw)
    findings.push({
      id: `${bill.id}-fixed`,
      billId: bill.id,
      kind: "billing_error",
      title: "Fixed charges billed on the full sanctioned load",
      detail: `Billed on ${fmt(bill.sanctionedKw)} kW; the tariff bills the higher of your MDI (${fmt(bill.mdiKw)} kW) and half the sanctioned load, so ${fmt(demand)} kW.`,
      impactPkr: withTax(fixedDiff),
      nextStep: `File a billing complaint with ${bill.disco} for a correction on the next bill.`,
    })
  }

  const further = line(bill.lines, "furtherTax")
  if (further > 0) {
    findings.push({
      id: `${bill.id}-further`,
      billId: bill.id,
      kind: "billing_error",
      title: "Further tax charged",
      detail: "3% further tax applies only to consumers without a sales tax registration (STRN).",
      impactPkr: further,
      nextStep: `If you hold an STRN, send it to ${bill.disco} to stop the charge.`,
    })
  }

  const pf = line(bill.lines, "pfPenalty")
  if (pf > 0) {
    findings.push({
      id: `${bill.id}-pf`,
      billId: bill.id,
      kind: "avoidable",
      title: "Low power factor penalty",
      detail: `Power factor ${bill.powerFactor.toFixed(2)} is below 0.90; each 1% below adds 2% to energy and fixed charges.`,
      impactPkr: withTax(pf),
      nextStep: "Get a capacitor bank sized and checked; most pay back within a few months.",
    })
  }

  const rates = tariffs[bill.tariff]
  const units = bill.peakKwh + bill.offPeakKwh
  const peakShare = bill.peakKwh / units
  if (peakShare > 0.15) {
    const shifted = Math.round(bill.peakKwh * 0.2)
    findings.push({
      id: `${bill.id}-peak`,
      billId: bill.id,
      kind: "opportunity",
      title: "Move 20% of peak-hour load",
      detail: `${Math.round(peakShare * 100)}% of your units fall in peak hours. Shifting ${fmt(shifted)} kWh to off-peak saves the rate difference.`,
      impactPkr: withTax(shifted * (rates.peak - rates.offPeak)),
      nextStep: "Schedule batch loads (compressors, pumps, pre-cooling) before 5 PM.",
    })
  }

  return {
    expected,
    expectedTotal: sumLines(expected),
    billedTotal: bill.amountPayable,
    findings,
  }
}

/** Overcharges plus avoidable charges: money already lost on this bill. */
export function recoverable(findings: Finding[]) {
  return findings.filter((f) => f.kind !== "opportunity").reduce((s, f) => s + f.impactPkr, 0)
}
