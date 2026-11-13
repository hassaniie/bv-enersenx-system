import * as React from "react"

/** Text segments joined by the ReUI inline separator (a rendered dot, never a typed "·"). */
export function Segments({ parts }: { parts: string | string[] }) {
  const list = Array.isArray(parts) ? parts : [parts]
  return (
    <>
      {list.map((part, i) => (
        <React.Fragment key={part}>
          {i > 0 && <span aria-hidden className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />}
          <span className="truncate">{part}</span>
        </React.Fragment>
      ))}
    </>
  )
}
