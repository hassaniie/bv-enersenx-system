// Network stand-in: every call waits a little, like a real request, and the
// `?state=error` demo switch makes calls fail so error states can be reviewed.

export class ApiError extends Error {}

export async function latency(ms = 350) {
  await new Promise((r) => setTimeout(r, ms))
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("state") === "error") {
    throw new ApiError("The EnerSenX service did not respond. Check your connection and try again.")
  }
}
