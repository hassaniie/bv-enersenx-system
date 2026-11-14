"use client"

import { EllipsisVerticalIcon, FileTextIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, type ReportTemplate, type ReportType } from "@/lib/reports-data"

import { templateIcons } from "./report-meta"

export type TemplateActions = {
  onGenerate: (t: ReportType) => void
  onSchedule: (t: ReportType) => void
  onShowReports: (t: ReportType) => void
}

const grid = "grid grid-cols-1 gap-2 @2xl:grid-cols-2 @5xl:grid-cols-3"

function TemplateMenu({ template, actions }: { template: ReportTemplate; actions: TemplateActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${template.title} actions`} />}>
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!!template.unavailable} onClick={() => actions.onGenerate(template.id)}>
          Generate now
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!!template.unavailable} onClick={() => actions.onSchedule(template.id)}>
          Schedule…
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onShowReports(template.id)}>Show past reports</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LastGenerated({ date, unavailable }: { date?: string; unavailable?: string }) {
  if (unavailable)
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Not available yet</span>
        <span className="text-xs font-medium">{unavailable}</span>
      </div>
    )
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">Last generated</span>
      <span className="text-xs font-medium tabular-nums">{date ? formatDate(date) : "Never"}</span>
    </div>
  )
}

export function ReportTemplates({
  status,
  templates,
  lastGenerated,
  view,
  error,
  onRetry,
  onClearSearch,
  actions,
}: {
  status: PanelStatus
  templates: ReportTemplate[]
  lastGenerated: (t: ReportType) => string | undefined
  view: "grid" | "list"
  error?: string
  onRetry: () => void
  onClearSearch: () => void
  actions: TemplateActions
}) {
  return (
    <section aria-labelledby="templates-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="templates-title" className="text-sm font-semibold tracking-tight">
          Report Templates
        </h2>
        <p className="text-sm text-muted-foreground">Choose a template to generate a new report.</p>
      </div>
      <PanelState
        status={status}
        isEmpty={templates.length === 0}
        error={error}
        onRetry={onRetry}
        skeleton={
          <div className={grid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        }
        empty={{
          icon: <FileTextIcon />,
          title: "No matching templates",
          description: "Try a different search.",
          action: "Clear search",
          onAction: onClearSearch,
        }}
      >
        {view === "grid" ? (
          <div className={grid}>
            {templates.map((t) => {
              const Icon = templateIcons[t.id]
              return (
                <Card key={t.id} size="sm">
                  <CardHeader>
                    <IconTile size="sm" aria-hidden>
                      <Icon />
                    </IconTile>
                    <CardAction>
                      <TemplateMenu template={t} actions={actions} />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-1">
                    <CardTitle>{t.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="justify-between gap-2">
                    <LastGenerated date={lastGenerated(t.id)} unavailable={t.unavailable} />
                    <Button size="sm" variant="outline" disabled={!!t.unavailable} onClick={() => actions.onGenerate(t.id)}>
                      Generate
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <ItemGroup>
            {templates.map((t) => {
              const Icon = templateIcons[t.id]
              return (
                <Item key={t.id} variant="outline" size="sm">
                  <ItemMedia>
                    <IconTile size="sm" aria-hidden>
                      <Icon />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{t.title}</ItemTitle>
                    <ItemDescription className="line-clamp-1">{t.description}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <span className="hidden @2xl:block">
                      <LastGenerated date={lastGenerated(t.id)} unavailable={t.unavailable} />
                    </span>
                    <Button size="sm" variant="outline" disabled={!!t.unavailable} onClick={() => actions.onGenerate(t.id)}>
                      Generate
                    </Button>
                    <TemplateMenu template={t} actions={actions} />
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </PanelState>
    </section>
  )
}
