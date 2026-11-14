"use client"

import * as React from "react"
import { CameraIcon, CheckIcon, FileTextIcon, RotateCcwIcon, UploadIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import { readBill, uploadBill, type Bill, type BillSource, type Site } from "@/lib/api"
import { cn } from "@/lib/utils"

import { FormError } from "./form-error"

const MAX_SIZE = 10 * 1024 * 1024

const stages = ["Uploading", "Reading the text", "Finding units, MDI and charges", "Checking against the tariff"]

/** Pick or photograph a bill, then watch it being read. */
export function BillStep({
  site,
  existing,
  onRead,
}: {
  site: Site
  /** A bill already uploaded and still being read (after a reload). */
  existing?: Bill
  onRead: (bill: Bill) => void
}) {
  const [phase, setPhase] = React.useState<"pick" | "reading" | "error">(existing ? "reading" : "pick")
  const [source, setSource] = React.useState<BillSource | null>(existing?.source ?? null)
  const [stage, setStage] = React.useState(0)
  const [error, setError] = React.useState<string>()
  const [billId, setBillId] = React.useState(existing?.id)
  const camera = React.useRef<HTMLInputElement>(null)

  const start = React.useCallback(
    async (src: BillSource, resumeId?: string) => {
      setSource(src)
      setPhase("reading")
      setError(undefined)
      setStage(0)
      try {
        const id = resumeId ?? (await uploadBill(site.id, src)).id
        setBillId(id)
        setStage(1)
        onRead(await readBill(id))
      } catch (e) {
        setError((e as Error).message)
        setPhase("error")
      }
    },
    [site.id, onRead]
  )

  // Resume a read that a reload interrupted.
  const resumed = React.useRef(false)
  React.useEffect(() => {
    if (existing && !resumed.current) {
      resumed.current = true
      start(existing.source, existing.id)
    }
  }, [existing, start])

  // Stages advance on a timer while readBill runs (it takes ~3.6 s).
  React.useEffect(() => {
    if (phase !== "reading" || stage === 0 || stage >= stages.length - 1) return
    const t = window.setTimeout(() => setStage((s) => s + 1), 1_200)
    return () => window.clearTimeout(t)
  }, [phase, stage])

  const [{ isDragging, errors }, { getInputProps, openFileDialog, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, addFiles, clearErrors }] =
    useFileUpload({
      accept: "application/pdf,image/*",
      maxSize: MAX_SIZE,
      onFilesAdded: (added) => {
        const f = added[0]?.file
        if (!f) return
        start({ fileName: f.name, kind: f.type === "application/pdf" ? "pdf" : "photo", sizeBytes: f.size })
      },
    })

  if (phase !== "pick") {
    const value = phase === "error" ? 0 : Math.round(((stage + 0.5) / stages.length) * 100)
    return (
      <>
        <CardHeader>
          <CardTitle>Reading your bill</CardTitle>
          <CardDescription>
            {source?.kind === "sample" ? `Sample ${site.disco} bill` : source?.fileName}
            {source?.sizeBytes ? `, ${formatBytes(source.sizeBytes)}` : ""}. This takes about 10 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Progress value={value} aria-label="Reading progress" />
          <ol className="flex flex-col gap-2" aria-live="polite">
            {stages.map((label, i) => {
              const done = phase === "reading" && i < stage
              const active = phase === "reading" && i === stage
              return (
                <li key={label} className={cn("flex items-center gap-2 text-sm", !done && !active && "text-muted-foreground")}>
                  <span className="flex size-4 items-center justify-center">
                    {done ? <CheckIcon aria-hidden className="size-4 text-success" /> : active ? <Spinner className="size-4" /> : <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/40" />}
                  </span>
                  {label}
                  {done && <span className="sr-only">, done</span>}
                </li>
              )
            })}
          </ol>
          {phase === "error" && (
            <>
              <FormError title="We couldn’t read this bill" message={error ?? "Something went wrong."} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => source && start(source, billId)}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => setPhase("pick")}>
                  Upload a different file
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Upload your latest bill</CardTitle>
        <CardDescription>The PDF from the {site.disco} website or a clear photo of the paper bill. We read it for you.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className={cn(
            "relative flex flex-col items-center gap-4 rounded-lg border border-dashed p-6 text-center transition-colors sm:p-8",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input {...getInputProps({ "aria-label": "Choose a bill file" })} className="sr-only" />
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <IconTile variant="soft" aria-hidden>
            <FileTextIcon />
          </IconTile>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Drag your bill here</span>
            <span className="text-xs text-muted-foreground">PDF, JPG or PNG up to {formatBytes(MAX_SIZE)}</span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={() => {
                clearErrors()
                camera.current?.click()
              }}
            >
              <CameraIcon data-icon="inline-start" />
              Take a photo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearErrors()
                openFileDialog()
              }}
            >
              <UploadIcon data-icon="inline-start" />
              Choose a file
            </Button>
          </div>
        </div>
        {errors.length > 0 && <FormError title="That file won’t work" message={errors.join(" ")} />}
        <div className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted-foreground">
          <span>No bill to hand?</span>
          <Button variant="ghost" size="xs" onClick={() => start({ fileName: `${site.disco} bill (sample)`, kind: "sample" })}>
            Use a sample {site.disco} bill
          </Button>
        </div>
      </CardContent>
    </>
  )
}
