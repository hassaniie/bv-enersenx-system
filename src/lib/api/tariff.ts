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

  const pkr = (n: number) => `PKR ${fmt(Math.round(n))}`
  const sampleNote = "Sample tariff rule, not yet checked against the current NEPRA notification for your DISCO."

  const fixedDiff = line(bill.lines, "fixed") - line(expected, "fixed")
  if (fixedDiff > 0) {
    const demand = billingDemandKw(bill.mdiKw, bill.sanctionedKw)
    const billedKw = Math.round(line(bill.lines, "fixed") / rates0(bill).fixedPerKw)
    findings.push({
      id: `${bill.id}-fixed`,
      billId: bill.id,
      line: "fixed",
      kind: "overcharge",
      confidence: "likely",
      title: "Fixed charges billed on the full sanctioned load",
      detail: `Billed on ${fmt(billedKw)} kW; the tariff bills the higher of your MDI (${fmt(bill.mdiKw)} kW) and half the sanctioned load, so ${fmt(demand)} kW.`,
      impactPkr: withTax(fixedDiff),
      nextStep: `File a billing complaint with ${bill.disco} for a refund and a correction on the next bill.`,
      method: {
        rule: `${bill.tariff}: fixed charges are billed on the higher of MDI and half the sanctioned load.`,
        lines: [
          { label: "Billed on", value: `${fmt(billedKw)} kW` },
          { label: "Should be billed on", value: `${fmt(demand)} kW (MDI ${fmt(bill.mdiKw)} kW, half of ${fmt(bill.sanctionedKw)} kW is ${fmt(Math.ceil(bill.sanctionedKw / 2))} kW)` },
          { label: "Difference", value: `${fmt(billedKw - demand)} kW × PKR ${fmt(rates0(bill).fixedPerKw)} = ${pkr(fixedDiff)}` },
          { label: "Plus 18% sales tax", value: pkr(withTax(fixedDiff)) },
        ],
        note: sampleNote,
      },
    })
  }

  const further = line(bill.lines, "furtherTax")
  if (further > 0) {
    findings.push({
      id: `${bill.id}-further`,
      billId: bill.id,
      line: "furtherTax",
      kind: "overcharge",
      confidence: "check",
      title: "Further tax charged",
      detail: "3% further tax applies only to consumers without a sales tax registration (STRN). If you hold one, this is an overcharge.",
      impactPkr: further,
      nextStep: `If you hold an STRN, send it to ${bill.disco} and ask for a refund of this charge.`,
      method: {
        rule: "Further tax (3%) is charged only to consumers who are not registered for sales tax.",
        lines: [
          { label: "Further tax on this bill", value: pkr(further) },
          { label: "Why we're not sure", value: "We don't know yet whether your STRN is on file with your DISCO. Add it in Settings to confirm." },
        ],
        note: sampleNote,
      },
    })
  }

  const pf = line(bill.lines, "pfPenalty")
  if (pf > 0) {
    const shortfall = Math.round((PF_TARGET - bill.powerFactor) * 100)
    const base = line(bill.lines, "peakEnergy") + line(bill.lines, "offPeakEnergy") + line(bill.lines, "fixed")
    findings.push({
      id: `${bill.id}-pf`,
      billId: bill.id,
      line: "pfPenalty",
      kind: "avoidable",
      confidence: "likely",
      title: "Low power factor penalty",
      detail: `Power factor ${bill.powerFactor.toFixed(2)} is below 0.90; each 1% below adds 2% to energy and fixed charges. It repeats every month until fixed.`,
      impactPkr: withTax(pf),
      nextStep: "Get a capacitor bank sized and checked; most pay back within a few months.",
      method: {
        rule: "Below a power factor of 0.90, each 1% shortfall adds 2% of energy and fixed charges.",
        lines: [
          { label: "Power factor on this bill", value: `${bill.powerFactor.toFixed(2)}, ${shortfall}% below 0.90` },
          { label: "Penalty", value: `${shortfall} × 2% × ${pkr(base)} = ${pkr(pf)}` },
          { label: "Plus 18% sales tax", value: `${pkr(withTax(pf))} a month` },
        ],
        note: sampleNote,
      },
    })
  }

  const rates = tariffs[bill.tariff]
  const units = bill.peakKwh + bill.offPeakKwh
  const peakShare = bill.peakKwh / units
  if (peakShare > 0.15) {
    const shifted = Math.round(bill.peakKwh * 0.2)
    const saving = shifted * (rates.peak - rates.offPeak)
    findings.push({
      id: `${bill.id}-peak`,
      billId: bill.id,
      line: "peakEnergy",
      kind: "estimate",
      confidence: "check",
      title: "Move 20% of peak-hour load",
      detail: `${Math.round(peakShare * 100)}% of your units fall in peak hours. Shifting ${fmt(shifted)} kWh to off-peak saves the rate difference.`,
      impactPkr: withTax(saving),
      nextStep: "Schedule batch loads (compressors, pumps, pre-cooling) before 5 PM.",
      method: {
        rule: "Units moved from peak to off-peak hours cost the off-peak rate instead of the peak rate.",
        lines: [
          { label: "Peak units on this bill", value: `${fmt(bill.peakKwh)} kWh (${Math.round(peakShare * 100)}% of all units)` },
          { label: "Assumed to move", value: `20%, so ${fmt(shifted)} kWh` },
          { label: "Rate difference", value: `PKR ${rates.peak.toFixed(2)} − PKR ${rates.offPeak.toFixed(2)} per kWh` },
          { label: "Estimate", value: `${pkr(saving)} + 18% sales tax = ${pkr(withTax(saving))} a month` },
        ],
        note: "An estimate: it assumes 20% of peak load can move. Your real saving depends on which machines can run earlier.",
      },
    })
  }

  return {
    expected,
    expectedTotal: sumLines(expected),
    billedTotal: bill.amountPayable,
    findings,
  }
}

/** Possible overcharges on a bill: one-time, can be claimed back. */
export function overcharged(findings: Finding[]) {
  return findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0)
}

const rates0 = (bill: Bill) => tariffs[bill.tariff]
