import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { cn } from "@/lib/utils"

type PanelProps = {
  title: string
  /** Small context after the title, e.g. the unit. */
  hint?: string
  /** Right side of the header: a period label or an action. */
  meta?: React.ReactNode
  className?: string
  panelClassName?: string
  children: React.ReactNode
}

/** One dashboard panel: a ReUI Frame with a header bar and a single content panel. */
export function Panel({ title, hint, meta, className, panelClassName, children }: PanelProps) {
  return (
    <Frame spacing="default" className={cn("min-w-0", className)}>
      <FrameHeader className="flex-row items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <FrameTitle className="truncate">{title}</FrameTitle>
          {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
        </div>
        {meta && <div className="shrink-0 text-xs text-muted-foreground">{meta}</div>}
      </FrameHeader>
      <FramePanel className={cn("flex flex-col gap-4", panelClassName)}>{children}</FramePanel>
    </Frame>
  )
}
