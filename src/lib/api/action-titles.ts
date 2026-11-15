import type { ActionKind } from "./types"

/** The action that deals with each kind of finding. */
export const actionTitles: Record<ActionKind, string> = {
  fixed: "File a complaint about fixed charges",
  further: "Send our STRN to stop further tax",
  pf: "Install a capacitor bank",
  peak: "Move batch loads out of peak hours",
}
