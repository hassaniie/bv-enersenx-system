"use client"

import { CircleAlertIcon, RotateCcwIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export type PanelStatus = "loading" | "error" | "ready"

type PanelStateProps = {
  status: PanelStatus
  isEmpty?: boolean
  error?: string
  onRetry?: () => void
  /** A Skeleton shaped like the real content. */
  skeleton: React.ReactNode
  empty: {
    icon: React.ReactNode
    title: string
    description: string
    action: string
    onAction?: () => void
  }
  children: React.ReactNode
}

/** Shared loading / error / empty handling, so every data region owns its states. */
export function PanelState({
  status,
  isEmpty,
  error,
  onRetry,
  skeleton,
  empty,
  children,
}: PanelStateProps) {
  if (status === "loading") {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading</span>
        {skeleton}
      </div>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Couldn’t load data</AlertTitle>
        <AlertDescription>{error ?? "Something went wrong."}</AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline" onClick={onRetry}>
            <RotateCcwIcon data-icon="inline-start" />
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (isEmpty) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{empty.icon}</EmptyMedia>
          <EmptyTitle>{empty.title}</EmptyTitle>
          <EmptyDescription>{empty.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline" onClick={empty.onAction}>
            {empty.action}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return <>{children}</>
}
