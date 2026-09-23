import { useMemo } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NodeInput } from "../NodeField/NodeInput"
import { NodeSelect } from "../NodeField/NodeSelect"
import { NodeSwitch } from "../NodeField/NodeSwitch"
import { NodeTextarea } from "../NodeField/NodeTextarea"
import type { NodeParameterEntry, NodeParameterField, NodeParameterValue } from "../../nodes/types"
import type { ParametersEditorsProps } from "./parametersEditorsProps"

type KeyValueRow = { key: string; value: string }

function asString(value: NodeParameterValue): string {
  return typeof value === "string" ? value : ""
}

function asBoolean(value: NodeParameterValue): boolean {
  return value === true
}

function asKeyValueRows(value: NodeParameterValue): KeyValueRow[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({
    key: typeof row.key === "string" ? row.key : "",
    value: typeof row.value === "string" ? row.value : "",
  }))
}

function KeyValueEditor({
  field,
  rows,
  error,
  onRowsChange,
}: {
  field: NodeParameterField
  rows: KeyValueRow[]
  error?: string
  onRowsChange(next: KeyValueRow[]): void
}) {
  const updateRow = (index: number, patch: Partial<KeyValueRow>) => {
    onRowsChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onRowsChange([...rows, { key: "", value: "" }])
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{field.label}</Label>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={row.key}
              placeholder="Key"
              aria-label={`${field.label} key ${index + 1}`}
              className="h-8 text-sm"
              onChange={(event) => updateRow(index, { key: event.target.value })}
            />
            <Input
              value={row.value}
              placeholder="Value"
              aria-label={`${field.label} value ${index + 1}`}
              className="h-8 text-sm"
              onChange={(event) => updateRow(index, { value: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Quitar fila ${index + 1}`}
              onClick={() => removeRow(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin filas. Agregá la primera.</p>
        ) : null}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-1" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Agregar fila
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function FieldEditor({
  field,
  entry,
  error,
  onChangeValue,
}: {
  field: NodeParameterField
  entry: NodeParameterEntry | undefined
  error?: string
  onChangeValue(value: NodeParameterValue): void
}) {
  const value = entry ? entry.value : field.defaultValue

  switch (field.editor) {
    case "select":
      return (
        <NodeSelect
          label={field.label}
          value={asString(value)}
          options={field.options ?? []}
          placeholder={field.placeholder}
          error={error}
          onChange={(next) => onChangeValue(next)}
        />
      )
    case "switch":
      return (
        <NodeSwitch
          label={field.label}
          value={asBoolean(value)}
          error={error}
          onChange={(next) => onChangeValue(next)}
        />
      )
    case "textarea":
      return (
        <NodeTextarea
          label={field.label}
          value={asString(value)}
          placeholder={field.placeholder}
          error={error}
          onChange={(next) => onChangeValue(next)}
        />
      )
    case "keyvalue":
      return (
        <KeyValueEditor
          field={field}
          rows={asKeyValueRows(value)}
          error={error}
          onRowsChange={(next) => onChangeValue(next)}
        />
      )
    case "input":
    default:
      return (
        <NodeInput
          label={field.label}
          value={asString(value)}
          type={field.type === "URL" ? "url" : "text"}
          placeholder={field.placeholder}
          error={error}
          onChange={(next) => onChangeValue(next)}
        />
      )
  }
}

export function ParametersEditors({ fields, values, onChange, errors = {} }: ParametersEditorsProps) {
  const requiredFields = useMemo(() => fields.filter((field) => field.required), [fields])
  const optionalFields = useMemo(() => fields.filter((field) => !field.required), [fields])

  const presentOptional = useMemo(
    () => optionalFields.filter((field) => values.some((entry) => entry.type === field.type)),
    [optionalFields, values],
  )

  const addableOptional = useMemo(
    () => optionalFields.filter((field) => !values.some((entry) => entry.type === field.type)),
    [optionalFields, values],
  )

  const getValue = (type: string): NodeParameterEntry | undefined =>
    values.find((entry) => entry.type === type)

  const setValue = (type: string, value: NodeParameterValue) => {
    const exists = values.some((entry) => entry.type === type)
    if (exists) {
      onChange(values.map((entry) => (entry.type === type ? { ...entry, value } : entry)))
    } else {
      onChange([...values, { type, value }])
    }
  }

  const addOptional = (type: string) => {
    const field = optionalFields.find((item) => item.type === type)
    if (!field) return
    if (values.some((entry) => entry.type === type)) return
    onChange([...values, { type: field.type, value: field.defaultValue }])
  }

  const removeOptional = (type: string) => {
    onChange(values.filter((entry) => entry.type !== type))
  }

  const renderField = (field: NodeParameterField, removable: boolean) => (
    <div key={field.type} className="relative">
      <FieldEditor
        field={field}
        entry={getValue(field.type)}
        error={errors[field.type]}
        onChangeValue={(value) => setValue(field.type, value)}
      />
      {removable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-destructive"
          aria-label={`Quitar ${field.label}`}
          title={`Quitar ${field.label}`}
          onClick={() => removeOptional(field.type)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {requiredFields.map((field) => renderField(field, false))}
      </div>

      {presentOptional.length > 0 ? (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          {presentOptional.map((field) => renderField(field, true))}
        </div>
      ) : null}

      {addableOptional.length > 0 ? (
        <div className="space-y-1.5 border-t border-border pt-4">
          <Label htmlFor="add-optional-parameter" className="text-xs font-medium text-muted-foreground">
            Agregar parámetro
          </Label>
          <select
            id="add-optional-parameter"
            aria-label="Agregar parámetro"
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value=""
            onChange={(event) => {
              const next = event.target.value
              if (!next) return
              addOptional(next)
            }}
          >
            <option value="" disabled>
              Parámetro opcional
            </option>
            {addableOptional.map((field) => (
              <option key={field.type} value={field.type}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  )
}
