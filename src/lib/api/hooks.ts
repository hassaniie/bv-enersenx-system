"use client"

import * as React from "react"

import { getVersion, subscribe } from "./store"

type Status = "loading" | "error" | "ready"

/** Re-renders when the demo store changes. 0 until the page has hydrated (the server never sees localStorage). */
function useStoreVersion() {
  return React.useSyncExternalStore(subscribe, () => getVersion() + 1, () => 0)
}

/**
 * A synchronous read of local state for app chrome (who is signed in, the
 * facility picker). Undefined until hydrated, so server HTML never disagrees.
 */
export function useStoreValue<T>(select: () => T): T | undefined {
  const v = useStoreVersion()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => (v === 0 ? undefined : select()), [v])
}

/**
 * Runs an async API call and reloads it quietly whenever the data changes.
 * `retry` re-runs it after an error.
 */
export function useApiQuery<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const v = useStoreVersion()
  const [state, setState] = React.useState<{ status: Status; data?: T; error?: string }>({ status: "loading" })
  const [attempt, setAttempt] = React.useState(0)
  const key = React.useRef<string>("")

  React.useEffect(() => {
    if (v === 0) return
    let alive = true
    const depsKey = JSON.stringify([...deps, attempt])
    // New inputs show a skeleton; a store change refreshes in place.
    if (depsKey !== key.current) setState((s) => ({ ...s, status: "loading" }))
    key.current = depsKey
    fn().then(
      (data) => alive && setState({ status: "ready", data }),
      (e: Error) => alive && setState({ status: "error", error: e.message })
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, attempt, ...deps])

  return { ...state, retry: () => setAttempt((a) => a + 1) }
}
