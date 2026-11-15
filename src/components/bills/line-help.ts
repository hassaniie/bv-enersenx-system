import type { BillLineKey } from "@/lib/api"

/** One plain sentence per bill line: what the charge is (principles.md C1, T4). */
export const lineHelp: Record<BillLineKey, string> = {
  peakEnergy: "Units used in peak hours, charged at the higher peak rate.",
  offPeakEnergy: "Units used outside peak hours, at the lower rate.",
  fixed: "A monthly charge per kW of billing demand, however many units you use.",
  fpa: "A per-unit charge for fuel costs that NEPRA sets each month.",
  pfPenalty: "Added when your power factor is below 0.90.",
  electricityDuty: "Provincial duty, a share of the energy charges.",
  gst: "General sales tax on the bill.",
  furtherTax: "An extra 3% for consumers without a sales tax registration (STRN).",
}
