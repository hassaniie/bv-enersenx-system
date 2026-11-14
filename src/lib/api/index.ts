// The app's data layer. Screens import from "@/lib/api" only; today these
// functions run against sample data in localStorage (see store.ts), later
// against the real API, with the same names and types.

export * from "./types"
export * from "./auth"
export * from "./sites"
export * from "./bills"
export * from "./onboarding"
export { recalculate, recoverable, tariffs, peakHours } from "./tariff"
export { reset as resetDemo } from "./store"
export { useApiQuery, useStoreValue } from "./hooks"
export * from "./scenarios"
export * from "./insights"
export * from "./reports"
