"use client"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** A labelled Select for forms. */
export function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  items,
  description,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  value: T | null
  onChange: (v: T) => void
  items: { value: T; label: string }[]
  description?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} disabled={disabled} onValueChange={(v) => v && onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}
