"use client"

import * as React from "react"

import type { PanelStatus } from "@/components/dashboard/panel-state"
import type { DemoState } from "@/lib/dashboard-data"

/**
 * Loads a page's data once per demo state and exposes status, data, error and
 * retry. A Retry after the demo error loads real data, so the error can be dismissed.
 */
export function useDemoQuery<T>(fetcher: (state: DemoState) => Promise<T>, demo: DemoState, initial: T) {
  const [status, setStatus] = React.useState<PanelStatus>("loading")
  const [data, setData] = React.useState<T>(initial)
  const [error, setError] = React.useState<string>()
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    let alive = true
    setStatus("loading")
    fetcher(attempt > 0 && demo === "error" ? "ready" : demo)
      .then((d) => {
        if (!alive) return
        setData(d)
        setStatus("ready")
      })
      .catch((e: Error) => {
        if (!alive) return
        setError(e.message)
        setStatus("error")
      })
    return () => {
      alive = false
    }
  }, [fetcher, demo, attempt])

  return { status, data, error, retry: () => setAttempt((a) => a + 1) }
}

const demoStates: DemoState[] = ["ready", "loading", "empty", "error"]

/** Parses `?state=` (read on the client, so static export keeps working). */
export function parseDemoState(value: string | null): DemoState {
  return demoStates.includes(value as DemoState) ? (value as DemoState) : "ready"
}
