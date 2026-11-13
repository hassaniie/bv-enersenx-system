import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { cn } from "@/lib/utils"

type PanelProps = {
  title: string
  /** Small context after the title, e.g. the unit. */
  hint?: string
  /** Right side of the header: a period label or an action. */
  meta?: React.ReactNode
  /** A summary line under the panel, e.g. a data-grid summary. */
  footer?: React.ReactNode
  /** Drop the panel padding so a data-grid can sit flush (ReUI's one `p-0` exception). */
  flush?: boolean
  className?: string
  panelClassName?: string
  children: React.ReactNode
}

/** One dashboard panel: a ReUI Frame with a header bar and a single content panel. */
export function Panel({ title, hint, meta, footer, flush, className, panelClassName, children }: PanelProps) {
  return (
    <Frame spacing="default" className={cn("min-w-0", className)}>
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <FrameTitle className="truncate">{title}</FrameTitle>
          {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
        </div>
        {meta && <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">{meta}</div>}
      </FrameHeader>
      <FramePanel className={cn(flush ? "p-0" : "flex flex-col gap-4", panelClassName)}>{children}</FramePanel>
      {footer && (
        <FrameFooter className="flex-row flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          {footer}
        </FrameFooter>
      )}
    </Frame>
  )
}
