/**
 * Lets a data-grid fill a stretched FramePanel so its rows grow instead of leaving
 * an empty band under the table.
 *
 * `DataGrid` renders no element (its `className` lands nowhere), and
 * `DataGridScrollArea` wraps its root in an unstyled `div`, with the scroll content
 * and the table viewport below it also unsized. None of those take a class, so
 * this wrapper passes `h-full` down to exactly those layers by their `data-slot`
 * (height only, nothing visual). Pair it with `tableClassNames={{ base: "h-full ..." }}`
 * and `className="h-full"` on `DataGridScrollArea`.
 */
export function GridFill({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full *:h-full [&_[data-slot=data-grid-table-viewport]]:h-full [&_[data-slot=scroll-area-content]]:h-full">
      {children}
    </div>
  )
}
